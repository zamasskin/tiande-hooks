import {updateCatElQuantityByQuery} from './catalog';
import {QUERY_CATALOG_QUANTITY_UPDATE} from '../constants';
import {getConnAndCntWorkersByQuery} from '../rabbitmq';

class RegisterHooks {
  protected hooks = [
    {
      query: QUERY_CATALOG_QUANTITY_UPDATE,
      call: updateCatElQuantityByQuery,
      countPackage: 20,
    },
  ];
}

export class Hooks extends RegisterHooks {
  public async getChanelByQuery(q: string, call: Function, countPackage = 1) {
    const {count, connection} = await getConnAndCntWorkersByQuery(q);
    for (let i = 0; i < count; i++) {
      const ch = await connection.createChannel();
      await ch.assertQueue(q, {durable: true});
      ch.prefetch(countPackage);
      ch.consume(q, async msg => {
        await call.apply(this, [ch, msg]);
      });
    }
  }
  public async run() {
    for (const hook of this.hooks) {
      try {
        this.getChanelByQuery(hook.query, hook.call, hook.countPackage);
        console.log('Start hook: ' + hook.query);
      } catch (e) {
        console.error('Error hooks: ' + hook.query + '. Error' + e.message);
      }
    }
  }
}
