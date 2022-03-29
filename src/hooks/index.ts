import {getConnAndCntWorkersByQuery} from '../rabbitmq';
import {
  QUERY_CATALOG_QUANTITY_UPDATE,
  QUERY_ORDER_EVENT,
  QUERY_EXCHANGE_OLD_BASKET,
  QUERY_EXCHANGE_DEAL,
} from '../constants';
import {updateCatElQuantityByQuery} from './catalog';
import {startOrderEvent} from './order';
import {startOldBasketEvents} from './oldbasket';
import {startExchangeDeal} from './exchangedeal';

class RegisterHooks {
  protected hooks = [
    {
      query: QUERY_CATALOG_QUANTITY_UPDATE,
      call: updateCatElQuantityByQuery,
      countPackage: 20,
    },
    {
      query: QUERY_ORDER_EVENT,
      call: startOrderEvent,
      countPackage: 20,
    },
    {
      query: QUERY_EXCHANGE_DEAL,
      call: startExchangeDeal,
      countPackage: 20,
    },
    // {
    //   query: QUERY_EXCHANGE_OLD_BASKET,
    //   call: startOldBasketEvents,
    //   countPackage: 1,
    // },
  ];
}

export class Hooks extends RegisterHooks {
  public async startQuery(q: string, call: Function, countPackage = 1) {
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
        await this.startQuery(hook.query, hook.call, hook.countPackage);
        console.log('Start hook: ' + hook.query);
      } catch (e: any) {
        console.error('Error hooks: ' + hook.query + '. Error ' + e.message);
      }
    }
  }
}
