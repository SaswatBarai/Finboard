export function getServiceEnv(defaults = {}) {
  const base = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || defaults.port || 4000),
    serviceName: process.env.SERVICE_NAME || defaults.serviceName || "finboard-service",
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    internalServiceKey: process.env.INTERNAL_SERVICE_KEY || "dev-internal-key",
    clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    bankDatabaseUrl: process.env.BANK_DATABASE_URL,
    bankingConfigured: Boolean(
      process.env.BANK_DATABASE_URL && !process.env.BANK_DATABASE_URL.includes("your-supabase-host")
    ),
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    mistralApiKey: process.env.MISTRAL_API_KEY,
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      apiKeySid: process.env.TWILIO_API_KEY_SID,
      apiKeySecret: process.env.TWILIO_API_KEY_SECRET,
      verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
      fromPhone: process.env.TWILIO_FROM_PHONE,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      otpTtlMinutes: Number(process.env.TWILIO_OTP_TTL_MINUTES || 5)
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || "noreply@finboard.local"
    },
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "")
        .split(",")
        .map((broker) => broker.trim())
        .filter(Boolean),
      clientId: process.env.KAFKA_CLIENT_ID || "finboard"
    },
    storage: {
      endpoint: process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT,
      region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-1",
      bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "finboard-kyc",
      accessKeyId: process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      presignExpirySeconds: Number(process.env.S3_PRESIGN_EXPIRY_SECONDS || 300)
    }
  };
  return { ...base, ...defaults };
}
