import { Class, DecoratorFactory } from 'brisk-ts-extends';
import { BriskOrmResultOption } from '../types';
import { getDelete, getInsert, getSelect, getUpdate } from '../core';

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

