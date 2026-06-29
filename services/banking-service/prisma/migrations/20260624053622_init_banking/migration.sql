-- CreateEnum
CREATE TYPE "BankRole" AS ENUM ('ADMIN', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'INVALID', 'REFUND_PENDING', 'REFUNDED');

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT,
    "holderName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "role" "BankRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT NOT NULL,
    "beneficiaryAccount" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "senderId" TEXT,
    "receiverId" TEXT,
    "senderAccountNumber" TEXT,
    "receiverAccountNumber" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "description" TEXT NOT NULL,
    "remarks" TEXT,
    "appUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "entryType" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balanceAfter" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankNotification" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT,
    "accountId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankVerification" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT NOT NULL,
    "accountId" TEXT,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "debitTransactionId" TEXT,
    "refundTransactionId" TEXT,
    "refundDueAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_email_key" ON "BankAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountNumber_key" ON "BankAccount"("accountNumber");

-- CreateIndex
CREATE INDEX "BankAccount_appUserId_idx" ON "BankAccount"("appUserId");

-- CreateIndex
CREATE INDEX "BankAccount_accountNumber_ifsc_idx" ON "BankAccount"("accountNumber", "ifsc");

-- CreateIndex
CREATE INDEX "Beneficiary_appUserId_idx" ON "Beneficiary"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_transactionRef_key" ON "BankTransaction"("transactionRef");

-- CreateIndex
CREATE INDEX "BankTransaction_appUserId_idx" ON "BankTransaction"("appUserId");

-- CreateIndex
CREATE INDEX "BankTransaction_senderId_idx" ON "BankTransaction"("senderId");

-- CreateIndex
CREATE INDEX "BankTransaction_receiverId_idx" ON "BankTransaction"("receiverId");

-- CreateIndex
CREATE INDEX "BankTransaction_createdAt_idx" ON "BankTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "BankNotification_appUserId_idx" ON "BankNotification"("appUserId");

-- CreateIndex
CREATE INDEX "BankNotification_accountId_idx" ON "BankNotification"("accountId");

-- CreateIndex
CREATE INDEX "BankVerification_appUserId_idx" ON "BankVerification"("appUserId");

-- CreateIndex
CREATE INDEX "BankVerification_status_idx" ON "BankVerification"("status");

-- CreateIndex
CREATE INDEX "BankVerification_refundDueAt_idx" ON "BankVerification"("refundDueAt");

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BankTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankNotification" ADD CONSTRAINT "BankNotification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankVerification" ADD CONSTRAINT "BankVerification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
