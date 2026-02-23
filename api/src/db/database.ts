/**
 * Azure SQL connection helper.
 *
 * Uses a single connection pool shared across all function invocations in the
 * same worker process. The pool is lazily initialised on the first call to
 * `getPool()` and reused on subsequent calls, which avoids the overhead of
 * opening a new connection on every request.
 *
 * Connection settings are read from environment variables (set in
 * `local.settings.json` for local dev, and in the Azure Function App
 * Application Settings for production).
 */
import sql from 'mssql';

const config: sql.config = {
  server: process.env.SQL_SERVER ?? '',
  database: process.env.SQL_DATABASE ?? '',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.SQL_USER ?? '',
      password: process.env.SQL_PASSWORD ?? '',
    },
  },
  options: {
    encrypt: true,           // Required for Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
};

let pool: sql.ConnectionPool | null = null;

/**
 * Returns the shared connection pool, creating it on first call.
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
  }
  return pool;
}

/**
 * Closes the shared pool. Call this during graceful shutdown if needed.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
