import {Connection} from 'mysql2';
import {query} from '../mysql';

export async function getElType(elId: number) {
  const [
    prop,
  ] = await query(
    'SELECT PROPERTY_550 as type FROM b_iblock_element_prop_s27 WHERE IBLOCK_ELEMENT_ID = ?',
    [elId]
  );
  if (!prop) {
    throw new Error('prop not found');
  }
  return prop.type;
}

export async function getStorage(catId: number) {
  const [
    storage,
  ] = await query(
    'SELECT VALUE as id FROM b_iblock_element_property WHERE IBLOCK_ELEMENT_ID = ? AND IBLOCK_PROPERTY_ID = 598',
    [catId]
  );
  if (!storage) {
    throw new Error('storage not found for ' + catId);
  }
  return storage.id;
}

export async function getParent(catId: number) {
  const [
    element,
  ] = await query(
    'SELECT * FROM b_iblock_element WHERE ID IN(SELECT VALUE FROM b_iblock_element_property WHERE IBLOCK_ELEMENT_ID = ? AND IBLOCK_PROPERTY_ID = 111)',
    [catId]
  );

  if (!element) {
    throw new Error('parent not found for ' + catId);
  }

  return element;
}

export async function getCatQuantity(catId: number) {
  const [catalog]: Array<{
    quantity: number;
  }> = await query(
    'SELECT QUANTITY AS quantity FROM b_catalog_product WHERE ID = ?',
    [catId]
  );
  return catalog.quantity;
}
