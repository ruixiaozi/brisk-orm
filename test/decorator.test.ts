import { BriskOrmQuery, BRISK_ORM_ORDER_BY_E } from './../src/decorator/query';
import { connect, distory } from '../src/core'
import { Delete, Insert, Result, Select, Update, Dao, BriskOrmDao, Table, PrimaryKey, Column, Many, One, Transaction, BriskOrmPage } from '../src/decorator'
import { BriskOrmContext, BriskOrmOperationResult } from '../src/types';
import mysql from 'mysql2/promise';
import { pool, queryFormatSql } from './mock';

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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select name, value from test1 where value >= 0`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select name, value from test1 where value >= 0`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select name, value from test1 where value >= 0`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select name, age from test where name = '1'`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`insert into test (name, age) values ('5', 123)`);
    const res2 = await new Test5().insertInfo5List([
      {name: '66', age: 66},
      {name: '66', age: 66}
    ]);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`insert into test (name, age) values ('66', 66), ('66', 66)`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set age = 444 where name = '4'`);
    const res2 = await new Test6().updateInfoByMinAge({name: 'new4'}, 60);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set name = 'new4' where age > 60`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`delete from test where name = 'new4'`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test where name = '1'`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`insert into test (name,age) values ('wang1', 11)`);
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
    expect(queryFormatSql).toHaveBeenLastCalledWith(`insert into test (name,age) values ('wang2', 12), ('wang3', 13)`);
    expect(saveAllRes.success).toBe(true);
    expect(saveAllRes.affectedRows).toBe(2);
    info8.myAge = 22;
    const updateRes = await new TestDao1().updateByPrimaryKey(info8);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set age = 22 where name = 'wang1'`);
    expect(updateRes.success).toBe(true);
    const deleteRes = await new TestDao1().deleteByPrimaryKey('wang2');
    expect(queryFormatSql).toHaveBeenLastCalledWith(`delete from test where name = 'wang2'`);
    expect(deleteRes.success).toBe(true);
  });

  // Dao装饰一个类，下面的所有操作方法应该创建正确的sql
  test('Dao all operator will create right sql', async () => {

    @Table('test')
    class Info10 {
      @PrimaryKey('name')
      myName?: string;

      @Column('age')
      myAge?: number;
    }

    @Dao(Info10)
    class TestDao1 extends BriskOrmDao<Info10> {
    }


    // 测试sql拼装
    const query1 = new BriskOrmQuery<Info10>();
    query1.eq('myAge', 10);
    query1.ne('myAge', 20);
    query1.gt('myAge', 9);
    query1.ge('myAge', 10);
    query1.lt('myAge', 11);
    query1.le('myAge', 10);
    query1.between('myAge', 9, 11);
    query1.notBetween('myAge', 1, 2);
    const everyEqParam: Partial<Info10> = {
      myAge: 10,
      myName: '1'
    }
    const someEqParam: Partial<Info10> = {
      myAge: 10,
      myName: '10'
    }
    // 计数
    await new TestDao1().count();
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select count(*) from test`);
    await new TestDao1().countQuery(query1);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select count(*) from test  where age = 10 and age <> 20 and age > 9 and age >= 10 and age < 11 and age <= 10 and age between 9 and 11 and age not between 1 and 2`);
    await new TestDao1().countEveryEq(everyEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select count(*) from test  where ( age = 10 and name = '1')`);
    await new TestDao1().countSomeEq(someEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select count(*) from test  where ( age = 10 or name = '10')`);

    // 列表
    const query2 = new BriskOrmQuery<Info10>();
    query2.like('myName', 't')
      .or().likeLeft('myName', 't')
      .or().likeRight('myName', 't')
      .and().notLike('myName', 'a')
      .notLikeLeft('myName', 'a')
      .notLikeRight('myName', 'a')
      .isNotNull('myName')
      .or().isNull('myAge')
      .or().in('myAge', [10, 20])
      .notIn('myAge', [5, 6])
      .groupBy('myName', 'myAge')
      .orderBy(BRISK_ORM_ORDER_BY_E.DESC, 'myAge');
    await new TestDao1().list();
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test`);
    await new TestDao1().listQuery(query2);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where name like binary '%t%' or name like binary '%t' or name like binary 't%' and name not like binary '%a%' and name not like binary '%a' and name not like binary 'a%' and name is not null or age is null or age in (10, 20) and age not in (5, 6) group by name,age order by age DESC`);
    await new TestDao1().listEveryEq(everyEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where ( age = 10 and name = '1')`);
    await new TestDao1().listSomeEq(someEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where ( age = 10 or name = '10')`);

    // 分页
    const page: BriskOrmPage = {
      page: 0,
      pageSize: 10
    }
    await new TestDao1().page(page);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test limit 0, 10`);
    await new TestDao1().pageQuery(query1, page);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where age = 10 and age <> 20 and age > 9 and age >= 10 and age < 11 and age <= 10 and age between 9 and 11 and age not between 1 and 2 limit 0, 10`);
    await new TestDao1().pageEveryEq(everyEqParam, page);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where ( age = 10 and name = '1') limit 0, 10`);
    await new TestDao1().pageSomeEq(someEqParam, page);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where ( age = 10 or name = '10') limit 0, 10`);

    // 查找
    await new TestDao1().findByPrimaryKey('10');
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test where name = '10' limit 0, 1`);
    await new TestDao1().findQuery(query1);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where age = 10 and age <> 20 and age > 9 and age >= 10 and age < 11 and age <= 10 and age between 9 and 11 and age not between 1 and 2 limit 0, 1`);
    await new TestDao1().findEveryEq(everyEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where ( age = 10 and name = '1') limit 0, 1`);
    await new TestDao1().findSomeEq(someEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`select * from test  where ( age = 10 or name = '10') limit 0, 1`);

    // 保存
    const info10 = new Info10();
    info10.myAge = 11;
    info10.myName = 'wang1';
    const info10s: Info10[] = [
      {
        myName: 'wang2',
        myAge: 12,
      },
      {
        myName: 'wang3',
        myAge: 13,
      },
    ];
    await new TestDao1().save(info10);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`insert into test (name,age) values ('wang1', 11)`);
    await new TestDao1().saveAll(info10s);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`insert into test (name,age) values ('wang2', 12), ('wang3', 13)`);

    // 更新
    info10.myAge = 10;
    await new TestDao1().updateByPrimaryKey(info10);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set age = 10 where name = 'wang1'`);
    await new TestDao1().updateQuery(info10, query1);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set age = 10  where age = 10 and age <> 20 and age > 9 and age >= 10 and age < 11 and age <= 10 and age between 9 and 11 and age not between 1 and 2`);
    await new TestDao1().updateEveryEq(info10, everyEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set age = 10  where ( age = 10 and name = '1')`);
    await new TestDao1().updateSomeEq(info10, someEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`update test set age = 10  where ( age = 10 or name = '10')`);

    // 删除
    await new TestDao1().deleteByPrimaryKey('10');
    expect(queryFormatSql).toHaveBeenLastCalledWith(`delete from test where name = '10'`);
    await new TestDao1().deleteQuery(query1);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`delete from test  where age = 10 and age <> 20 and age > 9 and age >= 10 and age < 11 and age <= 10 and age between 9 and 11 and age not between 1 and 2`);
    await new TestDao1().deleteEveryEq(everyEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`delete from test  where ( age = 10 and name = '1')`);
    await new TestDao1().deleteSomeEq(someEqParam);
    expect(queryFormatSql).toHaveBeenLastCalledWith(`delete from test  where ( age = 10 or name = '10')`);
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
      async test(ctx?: BriskOrmContext) {
        const res1 = await new TestDao3().updateByPrimaryKey({
          myName: '123',
          myAge: 12
        }, ctx)
        const res2 = await new TestDao3().deleteByPrimaryKey('mynam', ctx);
      }
    }

    new TestService9().test();
  });


});
