# BriskORM

BriskORM is a fast, light-weight, brisk ORM to work in nodejs,support mongodb. Use the brisk-ioc as the IoC/DI container.

BriskORM 是一个快速，轻量级，轻快的ORM工作在nodejs，支持mongodb。使用brisk-ioc作为IoC/DI容器。

[![npm version](https://badge.fury.io/js/brisk-orm.svg)](https://badge.fury.io/js/brisk-orm)

[![NPM](https://nodei.co/npm/brisk-orm.png)](https://nodei.co/npm/brisk-orm/)

# License

[MIT License](./LICENSE)

Copyright (c) 2021 Ruixiaozi

# Documentation

2. Installation

   First install Node.js and [brisk-ioc](https://github.com/ruixiaozi/brisk-ioc) 

   Reference to https://github.com/ruixiaozi/brisk-ioc
   
   
   
   Then:
   
   ```
   $ npm install brisk-controller
   ```
   
3. Importing and Using ( Example )

   ```
   // `src/entity/Test.js`
   class Test{
   	id = '';
   	name = '';
   }
   module.exports = exports = Test;
   
   // `src/dao/TestDao.js`
   const { Dao } =  require("brisk-orm").Decorator;
   const Test  = require("../entity/Test");
   
   @Dao({entities:[Test]})
   class TestDao{
   
   }
   module.exports = exports = TestDao;
   ```
   
   ```
   // `src/index.js`
   require("@babel/polyfill");
   const BriskIoC = require('brisk-ioc');
   const BriskORM = require('brisk-orm');
   const db = {
     "type": "mongodb",
     "host": "localhost",
     "port": 27017,
     "username": "mongoadmin",
     "password": "mongoadmin",
     "database": "test",
     "authSource": "admin",
     "useUnifiedTopology": true,
     "useNewUrlParser":true,
   }
   (async function () {
     await BriskIoC
     .use(BriskORM,{db:db})
     .scanComponents(__dirname,"./dao")
     .initAsync();
   
   })();
   ```


### plugin option


# Support

+ mongoose
+ bluebird
