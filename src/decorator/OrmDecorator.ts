import { MongoDBDaoOperatorFactor } from './../entity/factor/oprator/MongoDBDaoOperatorFactor';
import { IDaoOperatorOption } from "./../interface/option/IDaoOperatorOption";
import { Bean, DecoratorFactory, IBeanOption } from "brisk-ioc";
import { DaoOperatorFactor } from '../entity/factor/oprator/DaoOperatorFactor';
import { BaseDaoOperator } from '../entity/operator/BaseDaoOperator';

/**
 * 持久层类装饰器 工厂
 * @param {Object} option 选项
 * @returns
 */
export function Dao(option?: IBeanOption) {
  return new DecoratorFactory()
    .setClassCallback((target) => {
      Bean(option)(target);
    })
    .getDecorator();
}

/**
 * 操作属性装饰器 工厂
 * @param option 选项
 * @returns
 */
export function DaoOperator(option: IDaoOperatorOption) {
  return new DecoratorFactory()
    .setPropertyCallback((target, key) => {
      //构造操作对象
      const daoOperatorFactor: DaoOperatorFactor = new MongoDBDaoOperatorFactor(option.entity);
      const daoOperator: BaseDaoOperator = daoOperatorFactor.factory();

      Reflect.defineProperty(target, key, {
        enumerable: true,
        configurable: false,
        get() {
          return daoOperator;
        },
      });
    })
    .getDecorator();
}
