import mysql, {Connection} from 'mysql2';
import {callMethodBoolean} from './api';
import {
  dbDatabase,
  dbHost,
  dbPass,
  dbPort,
  dbUser,
  dbMaxConnections,
  dbMinConnections,
  Release,
  dbRelease,
} from './settings';
import knex from 'knex';
import {attachPaginate} from 'knex-paginate';

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

const _knex = knex({
  client: 'mysql2',
  connection: {
    host: dbHost,
    user: dbUser,
    port: dbPort,
    password: dbPass,
    database: dbDatabase,
    pool: {min: dbMinConnections, max: dbMaxConnections},
  },
  log: {
    warn(message) {},
    error(err) {
      console.error(err);
    },
    deprecate(message) {},
    debug(message) {},
  },
  debug: dbRelease === Release.development,
});
attachPaginate();
export default _knex;
