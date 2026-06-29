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
    openRouterVisionModel: process.env.OPENROUTER_VISION_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    mistralApiKey: process.env.MISTRAL_API_KEY,
    mistralTextModel: process.env.MISTRAL_TEXT_MODEL || "mistral-small-latest",
    mistralVisionModel: process.env.MISTRAL_VISION_MODEL || "pixtral-12b-latest",
    mistralOcrModel: process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest",
    llmMaxTokens: Number(process.env.LLM_MAX_TOKENS || 256),
    otp: {
      ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
      passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10)
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM
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
      presignExpirySeconds: Number(process.env.S3_PRESIGN_EXPIRY_SECONDS || 3600)
    }
  };
  return { ...base, ...defaults };
}
