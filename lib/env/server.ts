const requiredServerEnv = [
  "APP_ENV",
  "APP_URL",
  "DATABASE_URL",
  "SESSION_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function getServerEnv() {
  const values = Object.fromEntries(
    requiredServerEnv.map((key) => [key, process.env[key]]),
  ) as Record<(typeof requiredServerEnv)[number], string | undefined>;

  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
  }

  return values as Record<(typeof requiredServerEnv)[number], string>;
}
