import axios from 'axios';
import knex from './mysql';

export async function callMethod(name: string, params: any) {
  const {url = ''} =
    (await knex('tiande_options')
      .where('UF_NAME', 'portal_api_chat_url')
      .select('UF_VALUE as url')
      .first()) || {};
  const response = await axios.post(url + '/' + name, params);
  const {data} = response;
  if (!data) {
    throw new Error(`[${response.status}] ${response.statusText}`);
  }
  if (data.error) {
    throw new Error(data.error);
  }
  const {result} = data;
  return data;
}

export async function callMethodBoolean(name: string, params: any) {
  try {
    await callMethod(name, params);
    return true;
  } catch (e) {
    return false;
  }
}
