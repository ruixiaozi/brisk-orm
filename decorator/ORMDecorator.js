const {
  Schema
} = require("mongoose");
const mongoose = require('mongoose');
const MongoOperator = require('../operator/MongoOperator');



class ORMDecorator {

  static BriskDecorator = undefined;


  /**
   * 持久层类修饰符
   * @param {Object} option 选项
   * @returns
   */
  static Dao(option) {
    return function (target, key, descriptor) {
      //类装饰器
      if (!descriptor) {
        //环境上下文
        target.prototype.context = mongoose;
        //表结构列表
        target.prototype.schemas = {};

        //添加实体类表操作
        if (option) {
          if (option.entities && Array.isArray(option.entities)) {

            option.entities.forEach(s => {
              //创建scheme
              var objAttr = new s();
              var op = Object.keys(objAttr).reduce((pre, key) => {
                if (objAttr[key].constructor.name == "Array")
                  pre[key] = [];
                else
                  pre[key] = {
                    type: objAttr[key].constructor.name,
                    default: objAttr[key]
                  }
                return pre;
              }, {})
              var schema = new Schema(op);
              //添加到表结构列表
              target.prototype.schemas[s.name] = schema;

              //添加的列子
              target.prototype["insert" + s.name] = MongoOperator.insert(s.name);
              target.prototype["find" + s.name] = MongoOperator.find(s.name);
              target.prototype["findFirst" + s.name] = MongoOperator.findFirst(s.name);
              target.prototype["delete" + s.name] = MongoOperator.delete(s.name);
              target.prototype["update" + s.name] = MongoOperator.update(s.name);
            })
          }
        }

        ORMDecorator.BriskDecorator.Bean()(target);
        return;
      }

      //方法装饰器
      if (typeof descriptor.value == 'function') {
        ;

      }
      //属性装饰器
      else {
        ;
      }


      return descriptor;

    }
  }
}

module.exports = exports = ORMDecorator;
