import { Class, DecoratorFactory } from 'brisk-ts-extends';
import { BriskOrmResultOption } from '../types';
import { getDelete, getInsert, getSelect, getUpdate, startTransaction } from '../core';

/**
 * 结果装饰器
 * @param Target 结果类
 * @param option 结果选项
 * @returns
 */
export function Result(Target: Class, option?: BriskOrmResultOption): Function {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor, functionDes) => {
      if (functionDes) {
        functionDes.meta = {
          Target,
          option,
        };
      }
    })
    .getDecorator();
}

/**
 * Select查询装饰器
 * @param sql sql语句
 * @param id 当前select的id
 * @returns
 */
export function Select(sql: string, id?: string): Function {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor, functionDes) => {
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        value: getSelect(sql, functionDes?.meta?.Target, functionDes?.meta?.option, id),
      };
      return resDescriptor;
    })
    .getDecorator();
}

/**
 * Insert装饰器
 * @param sql sql语句
 * @param propertis 插入对象字段列表，需要按顺序
 * @returns
 */
export function Insert(sql: string, propertis: string[]): Function {
  return new DecoratorFactory()
    .setMethodCallback(() => {
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        value: getInsert(sql, propertis),
      };
      return resDescriptor;
    })
    .getDecorator();
}

/**
 * Update装饰器
 * @param sql sql语句
 * @param propertis 修改对象的字段列表，需要按set顺序填写
 * @returns update方法
 */
export function Update(sql: string, propertis: string[]): Function {
  return new DecoratorFactory()
    .setMethodCallback(() => {
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        value: getUpdate(sql, propertis),
      };
      return resDescriptor;
    })
    .getDecorator();
}

/**
 * Delete装饰器
 * @param sql sql语句
 * @returns delete方法
 */
export function Delete(sql: string): Function {
  return new DecoratorFactory()
    .setMethodCallback(() => {
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        value: getDelete(sql),
      };
      return resDescriptor;
    })
    .getDecorator();
}


/**
 * Transaction装饰器
 * 被Transaction装饰器修饰的方法，成为自动事务方法，该最后一个参数为ctx，会被自动注入BriskOrmContext实例
 * @returns
 */
export function Transaction(): Function {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor, functionDes) => {
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        async value(...args: any[]) {
          const ctx = await startTransaction();
          const realArgs = args;
          if (functionDes) {
            let undefinedLen = functionDes.params.length - args.length - 1;
            while (undefinedLen-- > 0) {
              realArgs.push(undefined);
            }
          }
          realArgs.push(ctx);
          try {
            const res = await Promise.resolve(descriptor.value.call(this, ...realArgs));
            await ctx.commit();
            return res;
          } catch (error) {
            await ctx.rollback(key.toString());
            throw error;
          } finally {
            ctx.end();
          }
        },
      };
      return resDescriptor;
    })
    .getDecorator();
}
