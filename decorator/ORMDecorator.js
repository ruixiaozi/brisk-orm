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
                let type = typeof objAttr[key];
                switch(type){
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
                    if(Array.isArray(objAttr[key]))
                      type = "Array";
                    else if(objAttr[key] instanceof Date){
                      type = "Date"
                    }
                    else{
                      type = "String";
                    }
                    break;
                }
                if (type == "Array")
                  pre[key] = [];
                else
                  pre[key] = {
                    type: type,
                    default: objAttr[key]
                  }
                return pre;
              }, {})
              var schema = new Schema(op);
              //添加到表结构列表
              target.prototype.schemas[s.name] = schema;

              //操作对象
              target.prototype[s.name] = MongoOperator.OperatorFactory(s.name);

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
