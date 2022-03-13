import { _PrimaryKey } from '../../decorator/OrmDecorator';
import { MongoDBDaoOperator } from '../../entity/operator/MongoDBDaoOperator';
import { Class, Key } from 'brisk-ioc';
import { DaoOperatorFactor } from './DaoOperatorFactor';
import { model, Schema, Types } from 'mongoose';
import { OrmCore } from '../../core/OrmCore';
import { snakeCase as _snakeCase } from 'lodash';
import { IForeignKeyOption } from '../../interface/option/IForeignKeyOption';
import { DBType, IColumOption } from '../../interface/option/IColumOption';

/**
 * MongoDBDaoOperatorFactor
 * @description MongoDB操作类工厂
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月06日 21:45:44
 * @version 2.0.0
 */
export class MongoDBDaoOperatorFactor extends DaoOperatorFactor {

  ormCore?: OrmCore;

  /**
   * 构造方法
   * @param EntityClass 实体类
   */
  constructor(private EntityClass: Class) {
    super();
    this.ormCore = OrmCore.getInstance();
  }

  /**
   * 工厂方法
   * @returns mongoDB操作对象
   */
  public factory(): MongoDBDaoOperator | undefined {
    // 创建scheme
    const entity = new this.EntityClass();
    // 数据表名称，使用下划线分隔的名称
    const name = _snakeCase(this.EntityClass.name);
    // 主键
    const primaryKey: _PrimaryKey | undefined = entity.$primary_key;
    // 外键列表
    const foreignKeyMap: Map<Key, IForeignKeyOption> | undefined = entity.$foreign_key;
    // 字段列表
    const columsMap: Map<Key, IColumOption> | undefined = entity.$colums;

    // 没有字段
    if (!columsMap || !primaryKey) {
      this.ormCore?.logger.warn(`no primarykey or colums: ${this.EntityClass.name}`);
      return undefined;
    }

    let definition: any = {};

    // 主键
    if (primaryKey) {
      // 字段名，下划线得方式 指定名称 或者 以命名存到数据库种
      const propertyName = _snakeCase(primaryKey.option?.name || primaryKey.key.toString());
      definition[propertyName] = {
        type: 'String',
        unique: true,
        default: () => Types.ObjectId().toString(),
      };
    }

    definition = [...columsMap].reduce((pre, [key, option]) => {
      const type = MongoDBDaoOperatorFactor.getSchemaType(option);
      // 字段名，下划线得方式 指定名称 或者 以命名存到数据库种
      const propertyName = _snakeCase(option.name || key.toString());
      pre[propertyName] = {
        type,
        default: type === 'Other' ? JSON.stringify(entity[key]) : entity[key],
        unique: option.unique || false,
        required: option.required || false,
      };

      // 添加key作为别名，用于mongoose匹配字段
      if (key !== propertyName) {
        pre[propertyName] = {
          ...pre[propertyName],
          alias: key,
        };
      }
      return pre;
    }, definition);

    const schema = new Schema(definition, {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    });

    // 外键
    if (foreignKeyMap) {
      [...foreignKeyMap].forEach(([key, option]) => {
        schema.virtual(key.toString(), {
          ref: option.ref.name,
          localField: _snakeCase(option.localPropName),
          foreignField: _snakeCase(option.foreignPropName),
          justOne: false,
        });
      });
    }

    // 创建Mongodb操作对象
    return new MongoDBDaoOperator(model(this.EntityClass.name, schema, name));
  }

  /**
   * 获取数据库类型
   * @param option 字段选项
   * @returns
   */
  private static getSchemaType(option: IColumOption) {
    let type;
    switch (option.type) {
      case DBType.Number:
        type = 'Number';
        break;
      case DBType.String:
        type = 'String';
        break;
      case DBType.Boolean:
        type = 'Boolean';
        break;
      case DBType.Array:
        type = [];
        break;
      case DBType.Date:
        type = 'Date';
        break;
      case DBType.PrimaryKey:
        type = 'String';
        break;
      default:
        type = 'Other';
        break;
    }
    return type;
  }

}
