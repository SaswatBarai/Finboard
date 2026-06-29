export function getServiceEnv(defaults = {}) {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || defaults.port || 4000),
    serviceName: process.env.SERVICE_NAME || defaults.serviceName || "finboard-service",
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    internalServiceKey: process.env.INTERNAL_SERVICE_KEY || "dev-internal-key",
    clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    bankDatabaseUrl: process.env.BANK_DATABASE_URL,
    bankingConfigured: Boolean(
      process.env.BANK_DATABASE_URL && !process.env.BANK_DATABASE_URL.includes("your-supabase-host")
    )
  };
}
