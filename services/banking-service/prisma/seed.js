import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "../src/modules/banking/prisma/create-client.js";

const serviceRoot = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(serviceRoot, "../../.env") });

const prisma = createPrismaClient(process.env.BANK_DATABASE_URL);

const accounts = [
  {
    holderName: "Demo Bank Admin",
    email: "admin@demobank.test",
    phone: "+919000000001",
    accountNumber: "100000000001",
    ifsc: "DEMO0000001",
    bankName: "Finboard Demo Bank",
    balance: 1000000,
    role: "ADMIN",
    avatar: "DB"
  },
  ["Rahul Sharma", "rahul.sharma@testbank.local", "+919000000002", "100000000002", 15000, "RS"],
  ["Priya Singh", "priya.singh@testbank.local", "+919000000003", "100000000003", 9500, "PS"],
  ["Aarav Mehta", "aarav.mehta@testbank.local", "+919000000004", "100000000004", 22000, "AM"],
  ["Neha Kapoor", "neha.kapoor@testbank.local", "+919000000005", "100000000005", 18450, "NK"],
  ["Vikram Rao", "vikram.rao@testbank.local", "+919000000006", "100000000006", 31200, "VR"],
  ["Ananya Das", "ananya.das@testbank.local", "+919000000007", "100000000007", 12750, "AD"],
  ["Kabir Khan", "kabir.khan@testbank.local", "+919000000008", "100000000008", 40000, "KK"],
  ["Meera Iyer", "meera.iyer@testbank.local", "+919000000009", "100000000009", 7600, "MI"],
  ["Rohan Verma", "rohan.verma@testbank.local", "+919000000010", "100000000010", 25800, "RV"],
  ["Isha Nair", "isha.nair@testbank.local", "+919000000011", "100000000011", 11000, "IN"],
  ["Anurag Swarnakar", "anurag@finboard.local", "+919348404335", "100000000012", 20000, "AS"],
].map((account) =>
  Array.isArray(account)
    ? {
        holderName: account[0],
        email: account[1],
        phone: account[2],
        accountNumber: account[3],
        ifsc: "DEMO0000001",
        bankName: "Finboard Demo Bank",
        balance: account[4],
        role: "CUSTOMER",
        avatar: account[5]
      }
    : account
);

async function main() {
  for (const account of accounts) {
    await prisma.bankAccount.upsert({
      where: { accountNumber: account.accountNumber },
      update: {
        holderName: account.holderName,
        email: account.email,
        phone: account.phone,
        ifsc: account.ifsc,
        balance: account.balance,
        role: account.role,
        avatar: account.avatar,
        status: "ACTIVE"
      },
      create: account
    });
  }

  console.log(`Seeded ${accounts.length} dummy bank accounts`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
