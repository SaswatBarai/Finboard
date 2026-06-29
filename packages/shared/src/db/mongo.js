import mongoose from "mongoose";

export async function connectMongo(uri, label = "MongoDB") {
  if (!uri) {
    throw new Error(`${label} URI is required`);
  }
  await mongoose.connect(uri);
  console.log(`${label} connected`);
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
