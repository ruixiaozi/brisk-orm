var Promise = require('bluebird');

class MongoOperator {
  static MongoQuery(model, qs) {
    var query = model;
    var qsList = qs.split("&");
    var patter = /([^=><]*)([=><]+)([^=><]*)/;
    qsList.forEach(s => {
      var re = patter.exec(s);

      if (re.length >= 4) {

        query = query.where(re[1]);
      }

      switch (re[2]) {
        case '<':
          query = query.lt(re[3]);
          break;
        case '>':
          query = query.gt(re[3]);
          break;
        case '=':
          query = query.equals(re[3]);
          break;
        case '<=':
          query = query.lte(re[3]);
          break;
        case '>=':
          query = query.gte(re[3]);
          break;

        case '=>':
          query = query.in(re[3].split(","));
          break;
      }

    })
    return query;
  }

  static findFirst(name) {
    return async function (qs) {
      return new Promise((resolve, reject) => {
        if (!name) {
          reject("no name");
          return;
        }

        var model = this.context.model(name, this.schemas[name]);
        var query = MongoOperator.MongoQuery(model, qs);
        query.findOne((err, res) => {
          if (err) {
            console.log("findOne err");
            reject(err)
          } else {
            console.log(res);
            resolve(res)
          }
        })


      });
    }
  }

  static find(name) {
    return async function (qs) {
      return new Promise((resolve, reject) => {
        if (!name) {
          reject("no name");
          return;
        }

        var model = this.context.model(name, this.schemas[name]);
        var query = MongoOperator.MongoQuery(model, qs);
        query.exec((err, res) => {
          if (err) {
            console.log("find err");
            reject(err)
          } else {
            console.log(res);
            resolve(res)
          }
        })


      });
    }
  }

  static insert(name) {
    return async function (obj) {
      return new Promise((resolve, reject) => {
        if (!name) {
          reject("no name");
          return;
        }

        var model = this.context.model(name, this.schemas[name]);
        model.create(obj, (err, res) => {
          if (err) {
            console.log("insert err");
            reject(err)
          } else {
            console.log(res);
            resolve(res)
          }
        })

      });


    }
  }

  static update(name) {
    return async function (qs, obj) {
      return new Promise((resolve, reject) => {
        if (!name) {
          reject("no name");
          return;
        }

        var model = this.context.model(name, this.schemas[name]);
        var query = MongoOperator.MongoQuery(model, qs);
        query.updateMany(obj, (err, res) => {
          if (err) {
            console.log("update err");
            reject(err)
          } else {
            console.log(res);
            resolve(res)
          }
        })



      });
    }
  }

  static delete(name) {
    return async function (qs) {
      return new Promise((resolve, reject) => {
        if (!name) {
          reject("no name");
          return;
        }

        var model = this.context.model(name, this.schemas[name]);
        var query = MongoOperator.MongoQuery(model, qs);
        query.deleteMany((err, res) => {
          if (err) {
            console.log("delete err");
            reject(err)
          } else {
            console.log(res);
            resolve(res)
          }
        })


      });
    }
  }
}
module.exports = exports = MongoOperator;
