import mysql from 'mysql2/promise'
// 数据库表 test
const tableTest = [
  {
    name: '1',
    age: 10
  }
];

// 数据库表 test1
const tableTest1 = [
  {
    name: '1',
    value: 20
  }
];


const mysqlPoolEnd = jest.fn(() => Promise.resolve(null));

const mysqlSelect = jest.fn((option: any) => {
  return Promise.resolve([option.sql.includes('test1') ? tableTest1 : tableTest]);
});
const mysqlInsert = jest.fn((option: any) => {
  return Promise.resolve([{
    fieldCount: 0,
    affectedRows: option.values[0].length
  }])
});
const mysqlUpdate = jest.fn((option: any) => {
  return Promise.resolve([{
    fieldCount: 0,
    affectedRows: 0, // 无法正确mock
  }]);
});
const mysqlDelete = jest.fn((option: any) => {
  return Promise.resolve([{
    fieldCount: 0,
    affectedRows: 0, // 无法正确mock
  }]);
});

export const queryFormatSql = jest.fn((sql: string) => {
  console.log(sql);
});

const mysqlPoolQuery = jest.fn((option: any) => {
  queryFormatSql(mysql.format(option.sql, option.values));

  if (option.sql.startsWith('select')) {
    return mysqlSelect(option);
  } else if (option.sql.startsWith('insert')) {
    return mysqlInsert(option);
  } else if (option.sql.startsWith('update')) {
    return mysqlUpdate(option);
  } else if (option.sql.startsWith('delete')) {
    return mysqlDelete(option);
  }
});

export const pool = {
  query: mysqlPoolQuery,
  end: mysqlPoolEnd,
  getConnection: jest.fn(() => undefined),
} as any;
