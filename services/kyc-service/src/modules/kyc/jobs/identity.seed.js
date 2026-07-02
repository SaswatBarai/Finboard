import { loadEnv } from "@finboard/config";
import { getServiceEnv } from "@finboard/config";
import { connectMongo, disconnectMongo } from "@finboard/shared";
import { DummyIdentity } from "../models/dummy-identity.model.js";

loadEnv();

// PAN 4th char must be a valid taxpayer type: P/C/H/F/A/T/B/L/J/G
// Aadhaar numbers satisfy the UIDAI Verhoeff check digit
const identities = [
  ["Rahul Sharma",         "ABCPS1234F", "111222333445"],
  ["Priya Singh",          "PQRPS6789K", "222333444555"],
  ["Aarav Mehta",          "LMNPM4321Q", "333444555664"],
  ["Neha Kapoor",          "NEHAK9021P", "444555666775"],
  ["Vikram Rao",           "VIKPR1234M", "555666777881"],
  ["Ananya Das",           "ANAPD8765D", "666777888998"],
  ["Kabir Khan",           "KABPK2468K", "777888999009"],
  ["Meera Iyer",           "MEEPI1357I", "888999000112"],
  ["Rohan Verma",          "ROHAN9753V", "999000111220"],
  ["Pritam Prayash Behera","BNZPM2501F", "444333222551"],
  ["Anurag Swarnakar", "QMRPS6975K", "634441264716"],
  ["Biswajit Sahoo", "QHWPS5183R", "616610992959"]
];

async function main() {
  await connectMongo(getServiceEnv().mongoUri, "KYC MongoDB");
  for (const [name, panNumber, aadhaarNumber] of identities) {
    await DummyIdentity.findOneAndUpdate(
      { panNumber },
      { name, panNumber, aadhaarNumber, address: "Demo India Address" },
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${identities.length} dummy KYC identities`);
  await disconnectMongo();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectMongo();
  process.exit(1);
});
