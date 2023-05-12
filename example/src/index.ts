import BriskOrm, { addTable, BRISK_ORM_TYPE_E, createTable, getAllTable, getCreateTableSQL, updateTable } from '../../src/index';
import path from 'path';
// 需要自己配置
import { dbConfig } from './db-config';

(async function() {
  BriskOrm.connect(dbConfig);


  /* await createTable('test', {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    engine: 'InnoDB',
    columns: [
      {
        name: 'id',
        type: BRISK_ORM_TYPE_E.VARCHAR,
        length: 240,
        notNull: true,
      },
      {
        name: 'name',
        type: BRISK_ORM_TYPE_E.VARCHAR,
        notNull: true,
      },
      {
        name: 'price',
        type: BRISK_ORM_TYPE_E.DOUBLE,
        length: 10,
        precision: 2,
        notNull: true,
      },
      {
        name: 'create_time',
        type: BRISK_ORM_TYPE_E.DATETIME,
        length: 3,
        notNull: true,
      },
    ],
    primaryKeys: ['id'],
    uniqueKeys: {
      'name': [
        {
          key: 'name',
          name: 'name'
        }
      ]
    },
  }) */

  /* await updateTable('test', {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    engine: 'InnoDB',
    columns: [
      {
        name: 'id',
        type: BRISK_ORM_TYPE_E.VARCHAR,
        length: 240,
        notNull: true,
      },
      {
        name: 'name',
        type: BRISK_ORM_TYPE_E.VARCHAR,
        notNull: true,
      },
      {
        name: 'price',
        type: BRISK_ORM_TYPE_E.DOUBLE,
        length: 10,
        precision: 2,
        notNull: true,
      },
      {
        name: 'update_time',
        type: BRISK_ORM_TYPE_E.DATETIME,
        length: 3,
        notNull: true,
      },
    ],
    primaryKeys: ['id'],
    uniqueKeys: {
      'test1': [
        {
          key: 'test1',
          name: 'name'
        },
        {
          key: 'test1',
          name: 'price'
        }
      ]
    },
  }) */

  const sql = await getCreateTableSQL('test');
  console.log([...sql.matchAll(/`(?<key>.*)` FOREIGN KEY/ug)].map(item => item.groups.key));

  await BriskOrm.distory();
})();
