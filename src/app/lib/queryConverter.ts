import { Pool as PgPool, QueryResult } from 'pg';
import { Pool as MySQLPool, RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';

// Type for the database mode
export type DatabaseMode = 'mysql' | 'postgresql';

// Type for normalized database results
export type DatabaseResult<T> = [T[], ResultSetHeader | null];

// Get current database mode from environment variable
export const getDatabaseMode = (): DatabaseMode => 
  (process.env.DATABASE_MODE || 'postgresql') as DatabaseMode;

// Convert MySQL style parameters (?) to PostgreSQL style ($1, $2, etc)
export const convertToPostgresParams = (query: string): string => {
  let paramCount = 0;
  return query.replace(/\?/g, () => `$${++paramCount}`);
};

// Handle the result differences between MySQL and PostgreSQL
export const normalizeResult = <T extends RowDataPacket>(
  result: QueryResult<T> | [T[], FieldPacket[]], 
  mode: DatabaseMode
): DatabaseResult<T> => {
  if (mode === 'postgresql') {
    const pgResult = result as QueryResult<T>;
    return [pgResult.rows, null];
  }
  // MySQL results are already in the expected format
  const [rows] = result as [T[], FieldPacket[]];
  return [rows, null];
};

// Main query executor that handles both database types
export async function executeQuery<T extends RowDataPacket>(
  pool: PgPool | MySQLPool,
  query: string,
  params: unknown[] = [],
  mode: DatabaseMode = getDatabaseMode()
): Promise<DatabaseResult<T>> {
  try {
    if (mode === 'postgresql') {
      const pgPool = pool as PgPool;
      const pgQuery = convertToPostgresParams(query);
      const result = await pgPool.query<T>(pgQuery, params);
      return normalizeResult<T>(result, mode);
    } else {
      const mysqlPool = pool as MySQLPool;
      const result = await mysqlPool.query<T[]>(query, params);
      return normalizeResult<T>(result, mode);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper for INSERT queries that need the inserted ID
export async function executeInsert(
  pool: PgPool | MySQLPool,
  query: string,
  params: unknown[] = [],
  mode: DatabaseMode = getDatabaseMode()
) {
  try {
    if (mode === 'postgresql') {
      const pgPool = pool as PgPool;
      // Add RETURNING id to get the inserted ID in PostgreSQL
      const pgQuery = convertToPostgresParams(query + ' RETURNING id');
      const result = await pgPool.query(pgQuery, params);
      return {
        insertId: result.rows[0]?.id,
        rows: result.rows
      };
    } else {
      const mysqlPool = pool as MySQLPool;
      const [result] = await mysqlPool.query(query, params);
      return result;
    }
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// Helper for handling JSON data
export const handleJsonData = <T>(data: T, mode: DatabaseMode = getDatabaseMode()): T | string => {
  if (mode === 'postgresql') {
    return JSON.stringify(data);
  }
  return data;
};

// Helper for handling date/time data
export const handleDateTime = (date: Date | string, mode: DatabaseMode = getDatabaseMode()): string => {
  if (mode === 'postgresql') {
    return new Date(date).toISOString();
  }
  return date.toString();
};

/**
 * Interface for transaction query with parameters
 */
export interface TransactionQuery {
  query: string;
  values: unknown[];
}

/**
 * Execute multiple queries in a single transaction
 * 
 * @param pool - Database connection pool
 * @param queries - Array of query objects with SQL and parameters
 * @param mode - Database mode (mysql or postgresql)
 * @returns Results of the transaction
 */
export async function executeTransaction(
  pool: PgPool | MySQLPool,
  queries: TransactionQuery[],
  mode: DatabaseMode = getDatabaseMode()
): Promise<(QueryResult | ResultSetHeader)[]> {
  if (mode === 'postgresql') {
    const pgPool = pool as PgPool;
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results: QueryResult[] = [];
      for (const { query, values } of queries) {
        const pgQuery = convertToPostgresParams(query);
        const result = await client.query(pgQuery, values);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    const mysqlPool = pool as MySQLPool;
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results: ResultSetHeader[] = [];
      for (const { query, values } of queries) {
        const [result] = await connection.query(query, values);
        results.push(result as ResultSetHeader);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
} 