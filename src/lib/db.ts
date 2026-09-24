import { Pool, type QueryResultRow } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function timedQuery<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; dbMs: number }> {
  const start = performance.now();
  const result = await pool.query<T>(text, params);
  const dbMs = Math.round((performance.now() - start) * 100) / 100;
  return { rows: result.rows, dbMs };
}
