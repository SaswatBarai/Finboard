import mongoose from "mongoose";

const dummyIdentitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    panNumber: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
    aadhaarNumber: { type: String, required: true, trim: true, unique: true, index: true },
    dateOfBirth: Date,
    address: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export const DummyIdentity = mongoose.model("DummyIdentity", dummyIdentitySchema);

