import { Pool as PgPool } from 'pg';
import { createPool } from 'mysql2/promise';
import { getDatabaseMode } from './queryConverter';

// PostgreSQL connection configuration
export const pgPool = new PgPool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// MySQL connection configuration
export const mysqlPool = process.env.DB_HOST ? createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}) : null;

// Export the current active pool based on DATABASE_MODE
export const pool = getDatabaseMode() === 'postgresql' ? pgPool : mysqlPool;

// Function to test database connection
export async function testConnection() {
  try {
    if (getDatabaseMode() === 'postgresql') {
      const client = await pgPool.connect();
      console.log("PostgreSQL database connected successfully");
      client.release();
    } else {
      const connection = await mysqlPool?.getConnection();
      console.log("MySQL database connected successfully");
      connection?.release();
    }
    return true;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return false;
  }
}

export async function dbConnect() {
  try {
    if (getDatabaseMode() === 'postgresql') {
      return await pgPool.connect();
    } else {
      return await mysqlPool?.getConnection();
    }
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
}
