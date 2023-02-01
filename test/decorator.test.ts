import { connect, distory } from '../src/core'
import { Delete, Insert, Result, Select, Update, Dao, BriskOrmDao, Table, PrimaryKey, Column, Many, One, Transaction } from '../src/decorator'
import { BriskOrmOperationResult } from '../src/types';
import mysql from 'mysql2/promise';
import { pool } from './mock';

describe('decorator', () => {
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

  // Select 当使用Select装饰器时，返回原始数据
  test('Select Should return row data When use Select only', async () => {
    class Test1 {
      @Select('select name, value from test1 where value >= ?')
      findOne(minValue: number): Promise<any>{ return Promise.resolve(null) }
    }
    const res = await new Test1().findOne(0);
    expect(res.length).toBe(1)
    expect(res[0].name).toBe('1');
    expect(res[0].value).toBe(20);
  });

  // Select 当使用Select和Result装饰器组合时（先用Result），返回Result指定得类实例
  test('Select Should return Target data When use Select and Result', async () => {
    class Info2 {
      name?: string;
      value?: number;
    }
    class Test2 {
      @Select('select name, value from test1 where value >= ?')
      @Result(Info2)
      findOne(minValue: number): Promise<Info2 | undefined>{ return Promise.resolve(undefined) }
    }
    const res = await new Test2().findOne(0);
    expect(res?.name).toBe('1');
    expect(res?.value).toBe(20);
    expect(res).toBeInstanceOf(Info2);
  });

  // Select 当使用Select和Result装饰器（包含option选项）组合时（先用Result），返回Result指定得类实例
  test('Select Should return Target data When use Select and Result option mapping and isList', async () => {
    class Info3 {
      myName?: string;
      myValue?: number;
    }
    class Test3 {
      @Select('select name, value from test1 where value >= ?')
      @Result(Info3, { isList: true, mapping: { myName: 'name', myValue: 'value' } })
      findList(minValue: number): Promise<Info3[] | undefined>{ return Promise.resolve(undefined) }
    }
    const res = await new Test3().findList(0);
    expect(res?.length).toBe(1);
    expect(res?.[0]?.myName).toBe('1');
    expect(res?.[0]?.myValue).toBe(20);
    expect(res?.[0]).toBeInstanceOf(Info3);
  });

  // Select 当使用Select和Result装饰器（包含option选项）组合时（先用Result），返回Result指定得类实例
  test('Select Should return association data When use Select and Result option mapping complex', async () => {
    class Info41 {
      name?: string;
      age?: number;
    }

    class Info4 {
      name?: string;
      value?: number;
      info41?: Info41[];
    }
    class Test4 {
      @Select('select name, age from test where name = ?', 'decorator.test.findInfo41ListByName')
      @Result(Info41, { isList: true })
      findInfo41ListByName(name: string): Promise<Info41[] | undefined> { return Promise.resolve(undefined) }

      @Select('select name, value from test1 where name = ?')
      @Result(Info4, { mapping: { info41: { dbProp: 'name', selectId: 'decorator.test.findInfo41ListByName' } } })
      findInfo4(name: string): Promise<Info4 | undefined> { return Promise.resolve(undefined) }
    }
    const res = await new Test4().findInfo4('1');
    expect(res?.name).toBe('1');
    expect(res?.value).toBe(20);
    expect(res).toBeInstanceOf(Info4);
    expect(res?.info41?.length).toBe(1);
    expect(res?.info41?.[0]).toBeInstanceOf(Info41);
    expect(res?.info41?.[0]?.name).toBe('1');
    expect(res?.info41?.[0]?.age).toBe(10);
  });

  // Insert 当使用Insert装饰器时，应该插入数据
  test('Insert Should insert data When use Insert', async () => {
    class Info5 {
      name?: string;
      age?: number;
    }
    class Test5 {
      @Insert('insert into test (name, age) values ?', ['name', 'age'])
      insertInfo5(info: Info5): Promise<BriskOrmOperationResult>{ throw new Error('failed') }

      @Insert('insert into test (name, age) values ?', ['name', 'age'])
      insertInfo5List(infos: Info5[]): Promise<BriskOrmOperationResult>{ throw new Error('failed') }
    }
    const res1 = await new Test5().insertInfo5({name: '5', age: 123});
    const res2 = await new Test5().insertInfo5List([
      {name: '66', age: 66},
      {name: '66', age: 66}
    ]);
    expect(res1.success).toBe(true);
    expect(res1.affectedRows).toBe(1);
    expect(res2.success).toBe(true);
    expect(res2.affectedRows).toBe(2);
  });

  // Update 当使用Update装饰器时，应该更新数据
  test('Update Should update data When use Update', async () => {
    class Info6 {
      name?: string;
      age?: number;
    }
    class Test6 {
      @Update('update test set age = ? where name = ?', ['age', 'name'])
      updateInfo(info: Info6): Promise<BriskOrmOperationResult>{ throw new Error('failed') }

      @Update('update test set name = ? where age > ?', ['name'])
      updateInfoByMinAge(info: Info6, minAge: number): Promise<BriskOrmOperationResult>{ throw new Error('failed') }
    }
    const res1 = await new Test6().updateInfo({name: '4', age: 444});
    const res2 = await new Test6().updateInfoByMinAge({name: 'new4'}, 60);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });

  // Delete 当使用Delete装饰器时，应该删除数据
  test('Delete Should delete data When use Delete', async () => {
    class Test7 {
      @Delete('delete from test where name = ?')
      deleteInfo(name: string): Promise<BriskOrmOperationResult>{ throw new Error('failed') }
    }
    const res = await new Test7().deleteInfo('new4');
    expect(res.success).toBe(true);
  });

  // Dao装饰一个类，应该自动生成orm操作
  test('Dao Should create a table operation When use Dao', async () => {

    @Table('test')
    class Info8 {
      @PrimaryKey('name')
      myName?: string;

      @Column('age')
      myAge?: number;
    }

    @Table('test1')
    class Info9 {
      @PrimaryKey('name')
      myName?: string;

      @Column('value')
      myValue?: number;

      @Many(Info8, 'name', 'name')
      info8s?: Info8[];

      @One(Info8, 'name', 'name')
      info8?: Info8;
    }

    @Dao(Info8)
    class TestDao1 extends BriskOrmDao<Info8> {
    }

    @Dao(Info9)
    class TestDao2 extends BriskOrmDao<Info9> {
    }

    const findRes = await new TestDao2().findList();
    expect(findRes?.length).toBe(1);
    expect(findRes?.[0].myName).toBe('1');
    expect(findRes?.[0].myValue).toBe(20);
    expect(findRes?.[0].info8).toEqual({myName: '1', myAge: 10});
    expect(findRes?.[0].info8s?.length).toBe(1);
    expect(findRes?.[0].info8s?.[0]).toEqual({myName: '1', myAge: 10});

    const info8 = new Info8();
    info8.myAge = 11;
    info8.myName = 'wang1';
    const saveRes = await new TestDao1().save(info8);
    expect(saveRes.success).toBe(true);
    expect(saveRes.affectedRows).toBe(1);
    const info8s = [
      {
        myName: 'wang2',
        myAge: 12,
      },
      {
        myName: 'wang3',
        myAge: 13,
      },
    ];
    const saveAllRes = await new TestDao1().saveAll(info8s);
    expect(saveAllRes.success).toBe(true);
    expect(saveAllRes.affectedRows).toBe(2);
    info8.myAge = 22;
    const updateRes = await new TestDao1().updateByPrimaryKey(info8);
    expect(updateRes.success).toBe(true);
    const deleteRes = await new TestDao1().deleteByPrimaryKey('wang2');
    expect(deleteRes.success).toBe(true);
  });


  // Transaction 事务装饰器
  test('Transaction Should get a transaction function', async () => {
    @Table('test')
    class Test9Entity {
      @PrimaryKey('name')
      myName?: string;

      @Column('age')
      myAge?: number;
    }

    @Dao(Test9Entity)
    class TestDao3 extends BriskOrmDao<Test9Entity> {
    }
    class TestService9 {

      @Transaction()
      async test() {
        const res1 = await new TestDao3().updateByPrimaryKey({
          myName: '123',
          myAge: 12
        })
        const res2 = await new TestDao3().deleteByPrimaryKey('mynam');
      }
    }

    new TestService9().test();
  });


});
