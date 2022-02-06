import { MongoDBDaoOperator } from "./../../operator/MongoDBDaoOperator";
import { Class } from "brisk-ioc";
import { DaoOperatorFactor } from "./DaoOperatorFactor";
import { model, Schema } from "mongoose";

/**
 * MongoDBDaoOperatorFactor
 * @description MongoDB操作类工厂
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月06日 21:45:44
 * @version 2.0.0
 */
export class MongoDBDaoOperatorFactor extends DaoOperatorFactor {
  /**
   * 构造方法
   * @param _entityClass 实体类
   */
  constructor(private _entityClass: Class) {
    super();
  }

  /**
   * 工厂方法
   * @returns mongoDB操作对象
   */
  public factory(): MongoDBDaoOperator {
    //创建scheme
    const entity = new this._entityClass();
    const op = Object.keys(entity).reduce((pre, key) => {
      let type: string = typeof entity[key];
      switch (type) {
        case "number":
          type = "Number";
          break;
        case "string":
          type = "String";
          break;
        case "boolean":
          type = "Boolean";
          break;
        default:
          if (Array.isArray(entity[key])) type = "Array";
          else if (entity[key] instanceof Date) {
            type = "Date";
          } else {
            type = "String";
          }
          break;
      }

      if (type == "Array") {
        pre[key] = [];
      } else {
        pre[key] = {
          type: type,
          default: type == "String" ? JSON.stringify(entity[key]) : entity[key],
        };
      }

      return pre;
    }, {} as any);
    const schema = new Schema(op);
    // 创建Mongodb操作对象
    return new MongoDBDaoOperator(model(this._entityClass.name, schema));
  }
}
