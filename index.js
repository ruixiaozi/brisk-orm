var Promise = require('bluebird');
var mongoose = require('mongoose');


const ORMDecorator = require('./decorator/ORMDecorator');

class BriskORM{
  static Decorator = ORMDecorator;

  static db = undefined;

  static priority = 0;

  static install(BriskIoC, option){
    if(!option || !option.db){
      console.log("brisk-orm err: no db conifig");
      return;
    }

    BriskORM.db = option.db;
    ORMDecorator.BriskDecorator = BriskIoC.CoreDecorator;

    BriskIoC.initList.push({
      fn: BriskORM.connectAsync,
      priority: BriskORM.priority
    })

    BriskIoC.$orm = BriskORM;
  }

  //初始化的时候链接
  static connectAsync() {
    let config = BriskORM.db;
    return new Promise((resolve, reject) => {
      mongoose.connect(
        `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?authSource=${config.authSource}`,
        {
          useUnifiedTopology: config.useUnifiedTopology,
          useNewUrlParser: config.useNewUrlParser
        }, function(err, res) {

        if (err) {
          console.error('Error connecting to "%s":', config.host, err);
          reject(err);
        }
        else{
          console.log('Connected successfully to "%s"', config.host);
          resolve();
        }

      });

    })

  }


}


module.exports = exports = BriskORM;
