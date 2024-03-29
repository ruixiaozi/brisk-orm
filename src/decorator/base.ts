import { Class, DecoratorFactory } from 'brisk-ts-extends';
import { BriskOrmResultOption, BRISK_ORM_PARAM_TYPE_E } from '../types';
import { addHook, BriskOrmHooks, getDelete, getInsert, getSelect, getUpdate, startTransaction } from '../core';

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
      const rowSqlArgs = functionDes?.params?.reduce((res, current, index) => {
        if (current.meta?.ormParamType === BRISK_ORM_PARAM_TYPE_E.RAW) {
          res.push(index);
        }
        return res;
      }, [] as number[]) || [];
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        value: getSelect(sql, functionDes?.meta?.Target, functionDes?.meta?.option, id, rowSqlArgs),
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
 * 被Transaction装饰器修饰的方法，成为自动事务方法
 * 该方法最后一个参数为ctx，默认会被自动注入BriskOrmContext实例
 * 如果调用时手动传入ctx，则不会触发自动事务
 */
export function Transaction(): Function {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor, functionDes) => {
      const resDescriptor: PropertyDescriptor = {
        enumerable: true,
        configurable: false,
        // eslint-disable-next-line object-shorthand
        value: async function(...args: any[]) {
          if (functionDes) {
            // 如果已经传入了ctx，这里就不用再开启事务了
            if (args.length === functionDes.params.length) {
              const res = await Promise.resolve(descriptor.value.call(this, ...args));
              return res;
            }

            // 计算可选参数的个数，并填充undefined
            const realArgs = args;
            let undefinedLen = functionDes.params.length - args.length - 1;
            while (undefinedLen-- > 0) {
              realArgs.push(undefined);
            }

            // 开启事务
            const ctx = await startTransaction();
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
          }
        },
      };
      return resDescriptor;
    })
    .getDecorator();
}


/**
 * Raw参数 装饰器
 * 被该装饰器装饰的参数，加入getSelect的sqlArgs参数中
 * @returns
 */
export function Raw(): Function {
  return new DecoratorFactory()
    .setParamCallback((target, key, index, param) => {
      if (param) {
        param.meta = {
          ormParamType: BRISK_ORM_PARAM_TYPE_E.RAW,
        };
      }
    })
    .getDecorator();
}

/**
 * 数据库连接前
 * @param priority 优先级，默认10
 * @returns
 */
export function BeforeOrmConn(priority: number = 10): Function {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor) => {
      addHook('before_conn', {
        priority,
        handler: descriptor.value?.bind(target),
      });
    })
    .getDecorator();
}

/**
 * 数据库连接后
 * @param priority 优先级，默认10
 * @returns
 */
export function AfterOrmConn(priority: number = 10): Function {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor) => {
      addHook('after_conn', {
        priority,
        handler: descriptor.value?.bind(target),
      });
    })
    .getDecorator();
}
