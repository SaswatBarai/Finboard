import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageConfig, isStorageEnabled } from "./config.js";

let client = null;
let bucketReady = false;

export function createS3Client() {
  if (!isStorageEnabled()) {
    return null;
  }

  if (!client) {
    const config = getStorageConfig();
    client = new S3Client({
      region: config.region,
      // endpoint is only set for MinIO / S3-compatible services; omit for native AWS S3
      ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: config.forcePathStyle } : {}),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  return client;
}

export async function ensureBucket(log) {
  if (!isStorageEnabled() || bucketReady) {
    return;
  }

  const s3 = createS3Client();
  const { bucket } = getStorageConfig();

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    log?.info?.(`Created S3 bucket: ${bucket}`);
  }

  bucketReady = true;
}

export async function uploadObject(key, body, contentType) {
  const s3 = createS3Client();
  if (!s3) {
    throw new Error("S3 storage is not configured");
  }

  const { bucket } = getStorageConfig();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );

  return { bucket, key };
}

export async function getPresignedDownloadUrl(key, expiresIn) {
  const s3 = createS3Client();
  if (!s3) {
    return null;
  }

  const { bucket, presignExpirySeconds } = getStorageConfig();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }),
    { expiresIn: expiresIn || presignExpirySeconds }
  );
}
