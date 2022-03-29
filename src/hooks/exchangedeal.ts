import {Channel, ConsumeMessage} from 'amqplib';
import {callMethodBoolean} from '../api';
import axios from 'axios';
import * as soap from 'soap';
import knex from '../mysql';
import crypto from 'crypto';
import moment from 'moment';
import * as _ from 'lodash';

async function getSoapUrl() {
  const defaultUrl = 'https://portal.tian.de.com:443/soap/integration.php?wsdl';
  try {
    const configRaw = await knex('tiande_options')
      .where('UF_NAME', 'config_integration_portal')
      .first();
    if (!configRaw) {
      return defaultUrl;
    }
    const config = JSON.parse(configRaw.UF_VALUE);
    return config?.soapPath || defaultUrl;
  } catch (e) {
    return defaultUrl;
  }
}

async function getOrderData(id: number) {
  const connectionSettings = await knex('tiande_api_connections')
    .where('UF_NAME', 'sondOrderInPortal')
    .select('UF_URL as url', 'UF_LOGIN as login', 'UF_PASSWORD as password')
    .first();
  if (!connectionSettings) {
    throw new Error('settings not found');
  }

  const date = moment().format('YYYY-MM-DD HH:mm:ss');
  const {url, login, password} = connectionSettings;
  const signature = crypto
    .createHash('sha256')
    .update(`${login}:${password}:${date}`)
    .digest('hex');
  const response = await axios.post(url, {
    login: login,
    signature,
    date,
    params: {id},
  });
  return response.data;
}

export async function startExchangeDeal(ch: Channel, msg: ConsumeMessage) {
  if (msg) {
    const orderId = Number(msg.content);
    try {
      const soapUrl = await getSoapUrl();
      const order = await getOrderData(orderId);
      const soapClient = await soap.createClientAsync(soapUrl);
      const soapCall: Function = _.get(soapClient, 'exchangeDealAsync');
      await soapCall.call(null, [{arDeals: [order]}]);
    } catch (e: any) {
      callMethodBoolean('im.message.add', {
        DIALOG_ID: 'chat127424',
        system: 'Y',
        message: '[b]startExchangeDeal[/b] [br]' + e.message + '[br]' + orderId,
      });
    } finally {
      ch.ack(msg);
    }
  }
}
