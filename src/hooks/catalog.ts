import {updateCatElQuantity, getAllCatId} from '../catalog/quantity';
import {QUERY_CATALOG_QUANTITY_UPDATE} from '../constants';
import {getConnAndCntWorkersByQuery, getConnection} from '../rabbitmq';

export async function startUpdateCatElQuantity() {
  const q = QUERY_CATALOG_QUANTITY_UPDATE;
  const {count, connection} = await getConnAndCntWorkersByQuery(q);
  for (let i = 0; i < count; i++) {
    const ch = await connection.createChannel();
    await ch.assertQueue(q, {durable: true});
    ch.prefetch(20);
    ch.consume(q, async msg => {
      if (msg) {
        if (Number(msg.content)) {
          await updateCatElQuantity(Number(msg.content));
        }
        ch.ack(msg);
      }
    });
  }
}

export async function registerAllCatElQ() {
  const q = QUERY_CATALOG_QUANTITY_UPDATE;
  const connection = await getConnection('144.76.163.146');
  const ch = await connection.createChannel();
  await ch.assertQueue(q);
  const catId = await getAllCatId();
  catId.forEach(id =>
    ch.sendToQueue(q, Buffer.from(String(id)), {persistent: true})
  );
}
