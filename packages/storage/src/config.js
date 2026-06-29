export function getStorageConfig() {
  const endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "finboard-kyc";
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  return {
    endpoint,
    region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-1",
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    presignExpirySeconds: Number(process.env.S3_PRESIGN_EXPIRY_SECONDS || 3600)
  };
}

export function isStorageEnabled() {
  const config = getStorageConfig();
  return Boolean(config.accessKeyId && config.secretAccessKey && config.bucket);
}
