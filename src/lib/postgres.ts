import { Pool } from 'pg';

// PostgreSQL connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config: any = {
      connectionString: process.env.DATABASE_URL,
      max: 5, // Reduce pool size for serverless
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    };

    // SSL configuration for production
    if (process.env.NODE_ENV === 'production') {
      config.ssl = {
        rejectUnauthorized: false,
        require: true,
      };
    }

    pool = new Pool(config);
  }
  return pool;
}

// Execute a query and return results
export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Execute a query and return single row
export async function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

// Execute a query and return count
export async function queryCount(text: string, params?: unknown[]): Promise<number> {
  const result = await query<{ count: string }>(text, params);
  return parseInt(result[0]?.count || '0');
}

// Close the connection pool
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
