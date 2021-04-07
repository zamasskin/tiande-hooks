import amqplib, {Connection} from 'amqplib';
import util from 'util';
import {createConnection, query} from './mysql';

export async function getConnection(h: string) {
  const conn = createConnection();
  const [conf]: Array<{
    host: string;
    port: number;
    login: string;
    pass: string;
  }> = await query(
    'SELECT UF_HOST as host, UF_PORT as port, UF_LOGIN as login, UF_PASS as pass FROM b_rabbitmq_connections WHERE UF_HOST = ?',
    [h]
  );
  conn.end();

  if (!conf) {
    throw new Error('host not found');
  }

  const {host, login, pass} = conf;

  const connection = await amqplib.connect(
    util.format('amqp://%s:%s@%s', login, pass, host)
  );
  return connection;
}

export async function getConnAndCntWorkersByQuery(q: string) {
  const sql = `
SELECT q.UF_WORKS_COUNT AS count, c.UF_HOST AS host 
FROM b_rabbitmq_queues as q
LEFT JOIN b_rabbitmq_connections AS c ON c.ID = q.UF_SERVER
WHERE UF_QUERY = ?
  `;
  const [conQ]: Array<{count: number; host: string}> = await query(sql, [q]);
  if (!conQ) {
    throw new Error('query not found');
  }
  return {
    count: conQ.count,
    connection: await getConnection(conQ.host),
  };
}
