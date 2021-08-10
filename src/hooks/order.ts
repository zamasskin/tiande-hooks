import {QUERY_ORDER_EVENT} from '../constants';
import {Channel, ConsumeMessage} from 'amqplib';
import axios from 'axios';
import crypto from 'crypto';
import moment from 'moment';
import {callMethodBoolean} from '../api';

export async function startOrderEvent(ch: Channel, msg: ConsumeMessage) {
  if (msg) {
    try {
      const params = JSON.parse(String(msg.content));
      if (!params.orderId) {
        return;
      }
      const url = 'https://devbx.tiande.ru/api/v1/sale/order/event.php';
      const login = 'api_order_event';
      const password = 'jCipoTDWhhIUfkRvcOMWDk3';

      const jsonString = JSON.stringify(params).replace(
        /[\u007f-\uffff]/g,
        c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
      );

      const signature = crypto
        .createHash('sha256')
        .update(jsonString + login + password)
        .digest('hex');

      const {data} = await axios.post(url, {login, signature, params});
      if (data.error) {
        throw new Error(data.error + '[br]' + JSON.stringify(params));
      }
    } catch (e) {
      callMethodBoolean('im.message.add', {
        DIALOG_ID: 'chat127424',
        system: 'Y',
        message: e.message,
      });
    } finally {
      ch.ack(msg);
    }
  }
}
