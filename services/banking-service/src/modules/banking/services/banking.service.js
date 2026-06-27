import { prisma } from "../prisma/client.js";
import { createNotification } from "../services/banking-notification.service.js";
import { generateTransactionRef, toDecimal, VERIFICATION_AMOUNT } from "../utils/money.util.js";

const REFUND_DELAY_MS = Number(process.env.BANK_VERIFICATION_REFUND_DELAY_MS || 45000);

const demoAccountSelect = {
  holderName: true,
  bankName: true,
  accountNumber: true,
  ifsc: true,
  balance: true,
  avatar: true,
  status: true
};

export async function listSeededAccountsForUser({ appUserId, email, phone, name }) {
  const linked = await prisma.bankAccount.findMany({
    where: { appUserId, role: "CUSTOMER" },
    orderBy: { accountNumber: "asc" },
    select: demoAccountSelect
  });

  if (linked.length > 0) {
    return linked;
  }

  const matchConditions = [];
  if (email) {
    matchConditions.push({ email: { equals: email.trim(), mode: "insensitive" } });
  }
  if (phone) {
    matchConditions.push({ phone });
  }
  if (name) {
    matchConditions.push({ holderName: { equals: name.trim(), mode: "insensitive" } });
  }

  if (matchConditions.length === 0) {
    return [];
  }

  return prisma.bankAccount.findMany({
    where: {
      role: "CUSTOMER",
      OR: matchConditions
    },
    orderBy: { accountNumber: "asc" },
    select: demoAccountSelect
  });
}

export async function getLinkedAccount(appUserId) {
  return prisma.bankAccount.findFirst({
    where: { appUserId },
    orderBy: { updatedAt: "desc" }
  });
}

export async function listLinkedAccounts(appUserId) {
  return prisma.bankAccount.findMany({
    where: { appUserId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      holderName: true,
      bankName: true,
      accountNumber: true,
      ifsc: true,
      balance: true,
      status: true,
      updatedAt: true
    }
  });
}

export async function unlinkBankAccount(appUserId, accountId) {
  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, appUserId }
  });

  if (!account) {
    throw Object.assign(new Error("Linked bank account not found"), { statusCode: 404 });
  }

  return prisma.bankAccount.update({
    where: { id: accountId },
    data: { appUserId: null }
  });
}

export async function getAccountSummary(appUserId) {
  const account = await getLinkedAccount(appUserId);
  if (!account) {
    return { account: null, recentTransactions: [], beneficiaries: [] };
  }

  const [recentTransactions, beneficiaries] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: {
        OR: [{ senderId: account.id }, { receiverId: account.id }, { appUserId }]
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.beneficiary.findMany({
      where: { appUserId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return { account, recentTransactions, beneficiaries };
}

export async function lookupAccount(accountNumber) {
  const account = await prisma.bankAccount.findUnique({
    where: { accountNumber },
    select: {
      holderName: true,
      bankName: true,
      accountNumber: true,
      ifsc: true,
      status: true
    }
  });

  if (!account) {
    throw Object.assign(new Error("No bank account found for this number"), { statusCode: 404 });
  }

  return account;
}

export async function verifyBankAccount(appUserId, user, payload) {
  const normalizedName = payload.accountHolderName.trim().toLowerCase();

  return prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.findFirst({
      where: {
        accountNumber: payload.accountNumber,
        ifsc: payload.ifsc.toUpperCase()
      }
    });

    if (!account || account.holderName.trim().toLowerCase() !== normalizedName) {
      await tx.bankVerification.create({
        data: {
          appUserId,
          accountNumber: payload.accountNumber,
          ifsc: payload.ifsc.toUpperCase(),
          accountHolderName: payload.accountHolderName,
          status: "INVALID"
        }
      });
      throw Object.assign(new Error("Invalid bank account details"), { statusCode: 404 });
    }

    if (account.status === "FROZEN") {
      throw Object.assign(new Error("This bank account is frozen"), { statusCode: 403 });
    }

    if (account.balance.lessThan(VERIFICATION_AMOUNT)) {
      await createNotification(tx, {
        appUserId,
        accountId: account.id,
        title: "Low Balance",
        message: "Your account does not have enough balance for the ₹2 verification debit."
      });
      throw Object.assign(new Error("Insufficient balance for bank verification"), { statusCode: 400 });
    }

    const updated = await tx.bankAccount.update({
      where: { id: account.id },
      data: {
        appUserId,
        balance: { decrement: VERIFICATION_AMOUNT }
      }
    });

    const debit = await tx.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("VRD"),
        senderId: account.id,
        senderAccountNumber: account.accountNumber,
        amount: VERIFICATION_AMOUNT,
        type: "DEBIT",
        status: "SUCCESS",
        description: "Bank Verification Debit",
        remarks: "₹2 debit for simulated bank account verification",
        appUserId
      }
    });

    await tx.ledgerEntry.create({
      data: {
        accountId: account.id,
        transactionId: debit.id,
        entryType: "DEBIT",
        amount: VERIFICATION_AMOUNT,
        balanceAfter: updated.balance
      }
    });

    const verification = await tx.bankVerification.create({
      data: {
        appUserId,
        accountId: account.id,
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
        accountHolderName: account.holderName,
        status: "REFUND_PENDING",
        debitTransactionId: debit.id,
        refundDueAt: new Date(Date.now() + REFUND_DELAY_MS)
      }
    });

    await createNotification(tx, {
      appUserId,
      accountId: account.id,
      title: "Bank Account Verified",
      message: "Bank Account Verified. ₹2 has been debited for bank account verification. The amount will be credited back within a few moments."
    });

    return { account: updated, verification };
  });
}

export async function processDueVerificationRefunds() {
  const due = await prisma.bankVerification.findMany({
    where: {
      status: "REFUND_PENDING",
      refundDueAt: { lte: new Date() },
      accountId: { not: null }
    },
    take: 20
  });

  for (const verification of due) {
    await prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findUnique({ where: { id: verification.accountId } });
      if (!account) {
        return;
      }

      const updated = await tx.bankAccount.update({
        where: { id: account.id },
        data: { balance: { increment: VERIFICATION_AMOUNT } }
      });

      const refund = await tx.bankTransaction.create({
        data: {
          transactionRef: generateTransactionRef("VRF"),
          receiverId: account.id,
          receiverAccountNumber: account.accountNumber,
          amount: VERIFICATION_AMOUNT,
          type: "CREDIT",
          status: "SUCCESS",
          description: "Verification Refund",
          remarks: "₹2 verification amount credited back successfully",
          appUserId: verification.appUserId
        }
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          transactionId: refund.id,
          entryType: "CREDIT",
          amount: VERIFICATION_AMOUNT,
          balanceAfter: updated.balance
        }
      });

      await tx.bankVerification.update({
        where: { id: verification.id },
        data: {
          status: "REFUNDED",
          refundTransactionId: refund.id,
          refundedAt: new Date()
        }
      });

      await createNotification(tx, {
        appUserId: verification.appUserId,
        accountId: account.id,
        title: "₹2 Refunded",
        message: "₹2 verification amount has been credited back successfully."
      });
    });
  }

  return due.length;
}

export async function transferMoney(appUserId, payload) {
  const amount = toDecimal(payload.amount);

  if (amount.lessThanOrEqualTo(0)) {
    throw Object.assign(new Error("Amount must be greater than 0"), { statusCode: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const sender = await tx.bankAccount.findFirst({ where: { appUserId } });
    if (!sender) {
      throw Object.assign(new Error("Verify your bank account before transferring money"), { statusCode: 400 });
    }

    if (sender.status === "FROZEN") {
      throw Object.assign(new Error("Sender account is frozen"), { statusCode: 403 });
    }

    const receiver = await tx.bankAccount.findFirst({
      where: {
        accountNumber: payload.accountNumber,
        ifsc: payload.ifsc.toUpperCase()
      }
    });

    if (!receiver) {
      await createNotification(tx, {
        appUserId,
        accountId: sender.id,
        title: "Transfer Failed",
        message: "Receiver account does not exist."
      });
      throw Object.assign(new Error("Receiver account does not exist"), { statusCode: 404 });
    }

    if (receiver.status === "FROZEN") {
      throw Object.assign(new Error("Receiver account is frozen"), { statusCode: 403 });
    }

    if (sender.id === receiver.id) {
      throw Object.assign(new Error("You cannot transfer to the same account"), { statusCode: 400 });
    }

    if (sender.balance.lessThan(amount)) {
      await createNotification(tx, {
        appUserId,
        accountId: sender.id,
        title: "Transfer Failed",
        message: "Insufficient balance for this transfer."
      });
      throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 });
    }

    const [updatedSender, updatedReceiver] = await Promise.all([
      tx.bankAccount.update({ where: { id: sender.id }, data: { balance: { decrement: amount } } }),
      tx.bankAccount.update({ where: { id: receiver.id }, data: { balance: { increment: amount } } })
    ]);

    const debit = await tx.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("DBT"),
        senderId: sender.id,
        receiverId: receiver.id,
        senderAccountNumber: sender.accountNumber,
        receiverAccountNumber: receiver.accountNumber,
        amount,
        type: "DEBIT",
        status: "SUCCESS",
        description: payload.remarks || "Money Sent",
        remarks: payload.remarks || `Transfer to ${receiver.holderName}`,
        appUserId
      }
    });

    const credit = await tx.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("CDT"),
        senderId: sender.id,
        receiverId: receiver.id,
        senderAccountNumber: sender.accountNumber,
        receiverAccountNumber: receiver.accountNumber,
        amount,
        type: "CREDIT",
        status: "SUCCESS",
        description: "Money Received",
        remarks: `Transfer from ${sender.holderName}`,
        appUserId: receiver.appUserId
      }
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          accountId: sender.id,
          transactionId: debit.id,
          entryType: "DEBIT",
          amount,
          balanceAfter: updatedSender.balance
        },
        {
          accountId: receiver.id,
          transactionId: credit.id,
          entryType: "CREDIT",
          amount,
          balanceAfter: updatedReceiver.balance
        }
      ]
    });

    await createNotification(tx, {
      appUserId,
      accountId: sender.id,
      title: "Money Sent",
      message: `₹${amount.toString()} sent to ${receiver.holderName}.`
    });

    if (receiver.appUserId) {
      await createNotification(tx, {
        appUserId: receiver.appUserId,
        accountId: receiver.id,
        title: "Money Received",
        message: `₹${amount.toString()} received from ${sender.holderName}.`
      });
    }

    return { debit, sender: updatedSender };
  });
}

export async function addBeneficiary(appUserId, payload) {
  const account = await prisma.bankAccount.findFirst({
    where: {
      accountNumber: payload.accountNumber,
      ifsc: payload.ifsc.toUpperCase()
    }
  });

  if (!account) {
    throw Object.assign(new Error("Beneficiary account not found"), { statusCode: 404 });
  }

  return prisma.beneficiary.create({
    data: {
      appUserId,
      beneficiaryAccount: account.accountNumber,
      beneficiaryName: account.holderName,
      ifsc: account.ifsc,
      bankAccountId: account.id
    }
  });
}

export async function listTransactions(appUserId, range = "all") {
  const account = await getLinkedAccount(appUserId);
  if (!account) {
    return [];
  }

  const now = new Date();
  const from =
    range === "today"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : range === "7d"
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : range === "month"
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : null;

  return prisma.bankTransaction.findMany({
    where: {
      AND: [
        {
          OR: [
            { appUserId },
            { AND: [{ senderId: account.id }, { type: "DEBIT" }] },
            { AND: [{ receiverId: account.id }, { type: "CREDIT" }] }
          ]
        },
        from ? { createdAt: { gte: from } } : {}
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function listAdminUsers() {
  return prisma.bankAccount.findMany({
    orderBy: { accountNumber: "asc" },
    include: { _count: { select: { sent: true, received: true } } }
  });
}

export async function listAdminTransactions() {
  return prisma.bankTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });
}

export async function setAccountFreeze(accountId, frozen) {
  return prisma.bankAccount.update({
    where: { id: accountId },
    data: { status: frozen ? "FROZEN" : "ACTIVE" }
  });
}

export async function resetAccountBalance(accountId, balance) {
  return prisma.bankAccount.update({
    where: { id: accountId },
    data: { balance: toDecimal(balance) }
  });
}

export async function debitForInvestment(appUserId, amountValue, description, targetAccount = null) {
  const amount = toDecimal(amountValue);

  return prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.findFirst({ where: { appUserId } });
    if (!account) {
      throw Object.assign(new Error("Complete bank verification before investing"), { statusCode: 400 });
    }
    if (account.status === "FROZEN") {
      throw Object.assign(new Error("Bank account is frozen"), { statusCode: 403 });
    }
    if (account.balance.lessThan(amount)) {
      throw Object.assign(new Error("Insufficient bank balance for this investment"), { statusCode: 400 });
    }

    const updated = await tx.bankAccount.update({
      where: { id: account.id },
      data: { balance: { decrement: amount } }
    });

    const debit = await tx.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("INV"),
        senderId: account.id,
        senderAccountNumber: account.accountNumber,
        receiverAccountNumber: targetAccount?.accountNumber,
        amount,
        type: "DEBIT",
        status: "SUCCESS",
        description: "Stock Investment Debit",
        remarks: targetAccount ? `${description}. Destination: ${targetAccount.accountHolder} (${targetAccount.accountNumber})` : description,
        appUserId
      }
    });

    await tx.ledgerEntry.create({
      data: {
        accountId: account.id,
        transactionId: debit.id,
        entryType: "DEBIT",
        amount,
        balanceAfter: updated.balance
      }
    });

    return { debit, account: updated };
  });
}
