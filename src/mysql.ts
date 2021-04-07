import mysql, {Connection} from 'mysql2';
import {dbDatabase, dbHost, dbPass, dbPort, dbUser} from './settings';

export function createConnection(): Connection {
  return mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPass,
    database: dbDatabase,
  });
}

const pool = mysql.createPool({
  connectionLimit: 12,
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPass,
  database: dbDatabase,
  multipleStatements: true,
});

export async function query(
  sql: string,
  values?: any | any[] | {[param: string]: any}
) {
  const [rows]: [any[], any] = await pool.promise().query(sql, values);
  return rows || [];
}
