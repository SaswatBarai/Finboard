import {
  addBeneficiary,
  getAccountSummary,
  listAdminTransactions,
  listAdminUsers,
  listLinkedAccounts,
  listSeededAccountsForUser,
  listTransactions,
  lookupAccount,
  resetAccountBalance,
  setAccountFreeze,
  transferMoney,
  unlinkBankAccount,
  verifyBankAccount
} from "../services/banking.service.js";
import { listNotifications, removeNotification } from "../services/banking-notification.service.js";
import { publishBankVerifiedEvent } from "../services/banking-events.service.js";

function getAppUser(req) {
  return {
    appUserId: req.user._id.toString(),
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role
  };
}

export async function getDemoAccounts(req, res, next) {
  try {
    res.json({ accounts: await listSeededAccountsForUser(getAppUser(req)) });
  } catch (error) {
    next(error);
  }
}

export async function getAccount(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.json(await getAccountSummary(appUserId));
  } catch (error) {
    next(error);
  }
}

export async function getLinkedAccounts(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.json({ accounts: await listLinkedAccounts(appUserId) });
  } catch (error) {
    next(error);
  }
}

export async function removeLinkedAccount(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.json({ account: await unlinkBankAccount(appUserId, req.params.id) });
  } catch (error) {
    next(error);
  }
}

export async function lookupBankAccount(req, res, next) {
  try {
    res.json({ account: await lookupAccount(req.params.accountNumber) });
  } catch (error) {
    next(error);
  }
}

export async function verifyBank(req, res, next) {
  try {
    const user = getAppUser(req);
    const result = await verifyBankAccount(user.appUserId, user, req.body);
    await publishBankVerifiedEvent(
      {
        userId: user.appUserId,
        account: result.account,
        verification: result.verification
      },
      req.log
    );
    res.status(201).json({
      message: "Bank Account Verified",
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function transfer(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.status(201).json(await transferMoney(appUserId, req.body));
  } catch (error) {
    next(error);
  }
}

export async function createBeneficiary(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.status(201).json({ beneficiary: await addBeneficiary(appUserId, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function getTransactions(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.json({ transactions: await listTransactions(appUserId, req.query.range || "all") });
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    res.json({ notifications: await listNotifications(appUserId) });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const { appUserId } = getAppUser(req);
    await removeNotification(appUserId, req.params.id);
    res.json({ message: "Notification removed" });
  } catch (error) {
    next(error);
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    res.json({ accounts: await listAdminUsers() });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTransactions(req, res, next) {
  try {
    res.json({ transactions: await listAdminTransactions() });
  } catch (error) {
    next(error);
  }
}

export async function freezeAccount(req, res, next) {
  try {
    res.json({ account: await setAccountFreeze(req.params.id, req.body.frozen) });
  } catch (error) {
    next(error);
  }
}

export async function resetBalance(req, res, next) {
  try {
    res.json({ account: await resetAccountBalance(req.params.id, req.body.balance) });
  } catch (error) {
    next(error);
  }
}
