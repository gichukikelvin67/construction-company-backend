const requiredEnvVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "FRONTEND_URL",
  "STORAGE_PROVIDER",
  "STORAGE_BUCKET",
  "STORAGE_REGION",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
] as const;

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is not defined in the .env file`);
  }
}

export const env = {
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER!,
STORAGE_BUCKET: process.env.STORAGE_BUCKET!,
STORAGE_REGION: process.env.STORAGE_REGION!,
STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY!,
STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY!,
STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || "",
};