var Promise = require('bluebird');

let models = {};
class MongoOperator {

  query = null;

  model = null;

  //创建操作对象
  static OperatorFactory(name) {
    return function () {
      var operator = new MongoOperator();

      operator.model = models[name] = models[name]? models[name] : this.context.model(name, this.schemas[name]);

      operator.query = operator.model.find();
      return operator;
    }
  }

  where(qs) {
    var qsList = qs.split("&");
    var patter = /([^=><]*)([=><]+)([^=><]*)/;
    qsList.forEach(s => {
      var re = patter.exec(s);

      if (re.length >= 4) {

        this.query = this.query.where(re[1]);

        switch (re[2]) {
          case '<':
            this.query = this.query.lt(re[3]);
            break;
          case '>':
            this.query = this.query.gt(re[3]);
            break;
          case '=':
            this.query = this.query.equals(re[3]);
            break;
          case '<=':
            this.query = this.query.lte(re[3]);
            break;
          case '>=':
            this.query = this.query.gte(re[3]);
            break;

          case '=>':
            this.query = this.query.in(re[3].split(","));
            break;
        }

      }



    })
    return this;
  }

  orderBy(sortObj) {
    /**
     * {filed:'asc',filed2:'desc'}
     */
    this.query = this.query.sort(sortObj);

    return this;
  }



  findFirstAsync() {
    return new Promise((resolve, reject) => {
      this.query.findOne((err, res) => {
        if (err) {
          console.log("findFirst err");
          reject(err)
        } else {
          console.log(res);
          resolve(res)
        }
      })
    });

  }

  findAsync() {
    return new Promise((resolve, reject) => {
      this.query.exec((err, res) => {
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

  insertAsync(obj) {
    return new Promise((resolve, reject) => {
      this.model.create(obj, (err, res) => {
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

  updateAsync(obj) {
    return new Promise((resolve, reject) => {
      this.query.updateMany(obj, (err, res) => {
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


  deleteAsync() {
    return new Promise((resolve, reject) => {
      this.query.deleteMany((err, res) => {
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
module.exports = exports = MongoOperator;
