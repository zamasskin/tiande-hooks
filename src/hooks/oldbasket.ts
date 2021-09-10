import axios, {AxiosError} from 'axios';
import {Channel, ConsumeMessage} from 'amqplib';
import {callMethodBoolean} from '../api';

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function sendData(sendParams: any, step = 0): Promise<any> {
  const url =
    'https://portal.tian.de.com/rest/6/uv0m0nq1oddx7gus/tiandeintegrations.exchangeoldbasket';
  try {
    const response = await axios.post(url, sendParams);
    return response;
  } catch (e) {
    if (step > 5) {
      throw e;
    }
    await timeout(200);
    return await sendData(sendParams, ++step);
  }
}

export async function startOldBasketEvents(ch: Channel, msg: ConsumeMessage) {
  const sendParams = JSON.parse(String(msg.content));
  const strMsg = String(msg.content);
  try {
    const response = await sendData(sendParams);
    const {data} = response;
    if (!data) {
      throw new Error(`[${response.status}] ${response.statusText} ${strMsg}`);
    }
    if (data.error) {
      throw new Error(data.error_description);
    }
  } catch (e: any) {
    callMethodBoolean('im.message.add', {
      DIALOG_ID: 'chat127424',
      system: 'Y',
      message: '[b]exchangeoldbasket[/b] [br]' + e.message + '[br]' + strMsg,
    });
  } finally {
    ch.ack(msg);
  }
}
