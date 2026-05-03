import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`Warning: Missing environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID") || "ai-account-share",
  appSecret: required("APP_SECRET") || "default-secret-change-me",
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
};
