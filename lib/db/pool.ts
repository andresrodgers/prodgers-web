import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

// Singleton para evitar múltiples pools en HMR de Next.js dev
const pool =
  global.__pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export const query = (sql: string, params?: unknown[]) => pool.query(sql, params);
export default pool;
