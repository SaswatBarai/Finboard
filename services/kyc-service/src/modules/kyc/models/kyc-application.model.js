import mongoose from "mongoose";

const uploadedDocumentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["pan", "aadhaar"], required: true },
    originalName: String,
    mimeType: String,
    sizeBytes: Number,
    storageKey: { type: String },
    path: String,
    url: String,
    ocrText: { type: String, default: "" },
    extracted: { type: mongoose.Schema.Types.Mixed, default: {} },
    extractionSource: { type: String, default: "not_extracted" },
    match: { type: Boolean, default: false }
  },
  { _id: false }
);

const kycApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    panNumber: { type: String, required: true, uppercase: true, trim: true },
    aadhaarNumber: { type: String, required: true, trim: true },
    dummyIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: "DummyIdentity" },
    status: {
      type: String,
      enum: ["draft", "failed", "pending_admin_review", "approved", "rejected", "reupload_requested"],
      default: "draft",
      index: true
    },
    failureReason: String,
    checks: {
      identityExists: { type: Boolean, default: false },
      nameMatchesDataset: { type: Boolean, default: false },
      panMatchesDataset: { type: Boolean, default: false },
      aadhaarMatchesDataset: { type: Boolean, default: false },
      panOcrMatches: { type: Boolean, default: false },
      aadhaarOcrMatches: { type: Boolean, default: false }
    },
    aiVerification: {
      overallScore: { type: Number, default: 0 },
      recommendation: {
        type: String,
        enum: ["approve", "review", "reject", ""],
        default: ""
      },
      fields: { type: mongoose.Schema.Types.Mixed, default: {} },
      alignments: { type: mongoose.Schema.Types.Mixed, default: {} },
      summary: { type: String, default: "" },
      verificationSource: { type: String, default: "" },
      model: { type: String, default: "" },
      verifiedAt: Date
    },
    documents: { type: [uploadedDocumentSchema], default: [] },
    adminRemarks: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    submittedAt: Date
  },
  { timestamps: true }
);

export const KycApplication = mongoose.model("KycApplication", kycApplicationSchema);
