import {Connection} from 'mysql2';
import {createConnection, query} from '../mysql';
import * as _ from 'lodash';
import * as SqlString from 'sqlstring';
import {getCatQuantity, getElType, getParent, getStorage} from './element';

export async function getSetsQuantity(elId: number, storageId: string) {
  const sets: Array<{
    id: string;
  }> = await query(
    'SELECT VALUE as id FROM b_iblock_element_prop_m27 WHERE IBLOCK_ELEMENT_ID = ? AND IBLOCK_PROPERTY_ID IN(599, 600)',
    [elId]
  );
  if (sets.length === 0) {
    return 0;
  }

  const setsId: {[key: string]: string[]} = _.groupBy(sets.map(set => set.id));

  const sql = `
SELECT 
	pe.VALUE AS id,
	pr.QUANTITY as quantity
FROM b_iblock_element_property as pe
LEFT JOIN b_iblock_element_property AS ps ON ps.IBLOCK_ELEMENT_ID = pe.IBLOCK_ELEMENT_ID AND ps.IBLOCK_PROPERTY_ID = 598
LEFT JOIN b_catalog_product AS pr ON pr.ID = pe.IBLOCK_ELEMENT_ID
WHERE 
	pe.VALUE IN(?) 
	AND pe.IBLOCK_PROPERTY_ID = 111
	AND ps.VALUE = '7049d29f-c3f1-11e4-81eb-c53dde4ed71b'`;

  const setsQuantity: Array<{id: string; quantity: number}> = await query(sql, [
    Object.keys(setsId),
  ]);

  const quantities = setsQuantity
    .map(q => q.quantity / setsId[q.id].length)
    .map(q => parseInt(String(q || 0)));

  return Math.min(...quantities);
}

export async function getCharacteristicQuantity(
  elId: number,
  storageId: string
) {
  const sql = `
SELECT MAX(QUANTITY) as quantity 
FROM b_catalog_product WHERE ID IN (
  SELECT IBLOCK_ELEMENT_ID FROM b_iblock_element_property WHERE IBLOCK_ELEMENT_ID IN (
    SELECT IBLOCK_ELEMENT_ID FROM b_iblock_element_property WHERE IBLOCK_PROPERTY_ID = 111 AND VALUE IN (
      SELECT IBLOCK_ELEMENT_ID FROM b_iblock_element_prop_s27 WHERE PROPERTY_557 = ?
    )
  )
  AND IBLOCK_PROPERTY_ID = 598
  AND VALUE = ?
)
  `;
  const [catalog = {quantity: 0}]: Array<{quantity: number}> = await query(
    sql,
    [elId, storageId]
  );

  return catalog.quantity;
}

export async function upsertQuantity(
  elId: number,
  storageId: string,
  q: number
) {
  const [
    element,
  ] = await query(
    'SELECT * FROM b_catalog_element_storage WHERE UF_ELEMENT_ID = ? AND UF_STORAGE_ID = ?',
    [elId, storageId]
  );
  let sql: string;
  if (element) {
    sql = SqlString.format(
      'UPDATE b_catalog_element_storage SET ? WHERE ID = ?',
      [{UF_QUANTITY: q}, element.ID]
    );
  } else {
    sql = SqlString.format('INSERT INTO b_catalog_element_storage SET ?', {
      UF_ELEMENT_ID: elId,
      UF_STORAGE_ID: storageId,
      UF_QUANTITY: q,
    });
  }

  await query(sql);
}

export async function updateSetsQuantityIfExists(
  elId: number,
  storageId: string
) {
  const sets: Array<{id: number}> = await query(
    'SELECT IBLOCK_ELEMENT_ID as id FROM b_iblock_element_prop_m27 WHERE IBLOCK_PROPERTY_ID IN(599, 600) AND VALUE = ?',
    elId
  );
  await Promise.all(
    sets.map(async set => {
      const quantity = await getSetsQuantity(set.id, storageId);
      await upsertQuantity(set.id, storageId, quantity);
    })
  );
}

export async function updateChsQuantityIfExists(
  elId: number,
  storageId: string
) {
  const chs: Array<{
    id: number;
  }> = await query(
    'SELECT PROPERTY_557 as id FROM b_iblock_element_prop_s27 WHERE IBLOCK_ELEMENT_ID = ? AND PROPERTY_557 IS NOT NULL',
    [elId]
  );

  await Promise.all(
    chs.map(async ch => {
      const quantity = await getCharacteristicQuantity(ch.id, storageId);
      await upsertQuantity(ch.id, storageId, quantity);
    })
  );
}

export async function updateCatElQuantity(catId: number) {
  try {
    const [storage, element, quantity] = await Promise.all([
      getStorage(catId),
      getParent(catId),
      getCatQuantity(catId),
    ]);

    const type = await getElType(element.ID);
    const setsTypeId = [
      '37243fe8-e35a-11e4-81eb-c53dde4ed71b',
      'c65fe453-e8fc-11e4-81eb-c53dde4ed71b',
    ];

    if (setsTypeId.includes(type)) {
      const quantity = await getSetsQuantity(element.ID, storage);
      await upsertQuantity(element.ID, storage, quantity);
    } else if (type === '93d7d8b1-802e-11e8-8555-d1a83d5fc31b') {
      const quantity = await getCharacteristicQuantity(element.ID, storage);
      await upsertQuantity(element.ID, storage, quantity);
    } else {
      await Promise.all([
        updateSetsQuantityIfExists(element.ID, storage),
        updateChsQuantityIfExists(element.ID, storage),
        upsertQuantity(element.ID, storage, quantity),
      ]);
    }
  } catch (e) {
    console.log(e.message);
  }
}

export async function getAllCatId() {
  const catId: Array<{id: number}> = await query(
    'SELECT ID as id FROM b_catalog_product'
  );
  return catId.map(cat => Number(cat.id));
}
