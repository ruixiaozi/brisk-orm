import { pool } from './mock';
import { connect, distory, getDelete, getInsert, getSelect, getUpdate, startTransaction, transaction } from '../src/core'
import mysql from 'mysql2/promise';

describe('core', () => {

  const mysqlCreatePool = jest.spyOn(mysql, 'createPool');

  beforeAll(() => {
    mysqlCreatePool.mockReturnValue(pool);
    connect({
      host: 'xxx.xxx.xxx',
      user: 'xxxx',
      password: 'xxxxx',
      database: 'xxxx'
    })
  });

  afterAll(async () => {
    await distory();
  });

  // getSelect应该返回一个查询方法，当传入sql参数
  test('getSelect Should return a select function When has sql param', async () => {
    const selectFunc = getSelect<any>('select * from test');
    const res = await selectFunc();
    expect(res?.length).toBe(1);
    expect(res?.[0].name).toBe('1');
    expect(res?.[0].age).toBe(10);
  });

  // getSelect应该返回一个返回指定类型得查询方法，当传入sql参数，以及Target
  test('getSelect Should return a target select function When has sql param and target param', async () => {
    class T1 {
      name?: string;
      age?: number;
    }
    const selectFunc = getSelect<T1 | undefined>('select * from test', T1);
    const res = await selectFunc();
    expect(res?.name).toBe('1');
    expect(res?.age).toBe(10);
  });

  // getSelect应该返回一个返回指定类型得查询方法，当传入sql参数、Target、以及option
  test('getSelect Should return a target select function When has sql param and target param and option param', async () => {
    class T2 {
      myName?: string;
      myAge?: number;
    }
    const selectFunc = getSelect<T2[] | undefined>('select * from test', T2, {
      isList: true,
      mapping: {
        myName: 'name',
        myAge: 'age',
      }
    });
    const res = await selectFunc();
    expect(res?.length).toBe(1);
    expect(res?.[0]?.myName).toBe('1');
    expect(res?.[0]?.myAge).toBe(10);
    expect(res?.[0]).toBeInstanceOf(T2);
  });

   // getSelect应该返回一个返回指定类型得查询方法，当传入sql参数、Target、以及option(包含复杂映射)
   test('getSelect Should return a target select function When has sql param and target param and option param contain complex', async () => {
    class T31 {
      name?: string;
      age?: number;
    }

    class T3 {
      name?: string;
      value?: number;
      t31?: T31[];
    }

    const selectT31ByName = getSelect<T31[] | undefined>('select name, age from test where name = ?', T31, {
      isList: true,
    }, 'core.test.selectT31ByName');

    const selectT3 = getSelect<T3 | undefined>('select name, value from test1 where name = ?', T3, {
      mapping: {
        t31: {
          dbProp: 'name',
          selectId: 'core.test.selectT31ByName',
        }
      }
    });
    const res = await selectT3('1');
    expect(res?.name).toBe('1');
    expect(res?.value).toBe(20);
    expect(res).toBeInstanceOf(T3);
    expect(res?.t31?.length).toBe(1);
    expect(res?.t31?.[0]).toBeInstanceOf(T31);
    expect(res?.t31?.[0]?.name).toBe('1');
    expect(res?.t31?.[0]?.age).toBe(10);
  });

  // getInsert应该返回一个插入方法(可一条，也可多条)，当传入sql参数和properties参数
  test('getInsert Should return a insert function When has sql param and properties param', async () => {
    class T4 {
      name?: string;
      age?: number;
    }
    const insertOne = getInsert<T4>('insert into test (name, age) values ?', ['name', 'age']);
    const insertMany = getInsert<T4[]>('insert into test (name, age) values ?', ['name', 'age']);
    const res1 = await insertOne({
      name: '11',
      age: 11
    });
    const res2 = await insertMany([
      { name: '22', age: 22 },
      { name: '33', age: 33 },
    ]);
    expect(res1.success).toBe(true);
    expect(res1.affectedRows).toBe(1);
    expect(res2.success).toBe(true);
    expect(res2.affectedRows).toBe(2);
  });

  // getUpdate应该返回一个更新方法，当传入sql参数和properties参数
  test('getUpdate Should return a update function When has sql param and properties param', async () => {
    class T5 {
      name?: string;
      age?: number;
    }
    const updateT5 = getUpdate<T5>('update test set age = ? where name = ?', ['age', 'name']);
    const updateT5ByMinAge = getUpdate<T5>('update test set name = ? where age >= ?', ['name']);
    const res1 = await updateT5({
      name: '11',
      age: 11
    });
    const res2 = await updateT5ByMinAge({
      name: '11'
    }, 10);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });

  // getDelete应该返回一个更新方法，当传入sql参数
  test('getDelete Should return a delete function When has sql param', async () => {
    const deleteFunc = getDelete('delete from test where name = ?');

    const res = await deleteFunc('2');
    expect(res.success).toBe(true);
  });

  // 手动事务
  test('startTransaction Should return context', async () => {
    const ctx = await startTransaction();
    try {
      class T6 {
        name?: string;
        age?: number;
      }
      const updateT6 = getUpdate<T6>('update test set age = ? where name = ?', ['age', 'name']);
      const res1 = await updateT6({
        name: '11',
        age: 11
      },);
      if (!res1.affectedRows) {
        throw new Error();
      }
      const deleteFunc = getDelete('delete from test where name = ?');
      const res = await deleteFunc('2', ctx);

      await ctx.commit();
    } catch (error) {
      await ctx.rollback('test');
    } finally {
      ctx.end();
    }
  });

  // 自动事务
  test('transaction Should start a auto transaction', async () => {
    await transaction(async(ctx) => {
      class T7 {
        name?: string;
        age?: number;
      }
      const updateT7 = getUpdate<T7>('update test set age = ? where name = ?', ['age', 'name']);
      const res1 = await updateT7({
        name: '11',
        age: 11
      },);
      const deleteFunc = getDelete('delete from test where name = ?');
      const res = await deleteFunc('2', ctx);
    }, 'test')

  });

});
