import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "India" }
  },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, trim: true, default: "" },
    accountNumberMasked: { type: String, trim: true, default: "" },
    ifsc: { type: String, uppercase: true, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    verified: { type: Boolean, default: false }
  },
  { _id: false }
);

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    fullName: { type: String, trim: true, default: "" },
    dateOfBirth: Date,
    pan: { type: String, uppercase: true, trim: true, default: "" },
    mobileNumber: { type: String, trim: true, default: "" },
    emailAddress: { type: String, lowercase: true, trim: true, default: "" },
    maritalStatus: {
      type: String,
      enum: ["", "Single", "Married", "Other"],
      default: ""
    },
    gender: {
      type: String,
      enum: ["", "Male", "Female", "Other", "Prefer not to say"],
      default: ""
    },
    incomeRange: {
      type: String,
      enum: ["", "Below 1 Lac", "1 Lac - 5 Lac", "5 Lac - 10 Lac", "10 Lac - 25 Lac", "Above 25 Lac"],
      default: ""
    },
    occupation: { type: String, trim: true, default: "" },
    fatherName: { type: String, trim: true, default: "" },
    motherName: { type: String, trim: true, default: "" },
    address: { type: addressSchema, default: () => ({}) },
    bank: { type: bankSchema, default: () => ({}) },
    kycStatus: {
      type: String,
      enum: ["not_started", "profile_pending", "pending_review", "approved", "rejected"],
      default: "profile_pending",
      index: true
    }
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);

