# 修改日志 0.x.x [Current]

> 次版本：每季度发布一次，向下兼容的功能性新增  
> 修订版本：每周发布一次(紧急版本随时发布)，向下兼容的问题修正

## 0.0.4 [Current] 
###### 发布日期：2023-05.23
###### 兼容性：0.x.x

+ 支持GEOMETRY 地理信息POINT类型
+ 增加select返回值的聚合选项aggregation
+ 弃用select返回值的isCount选项
+ 修复ForeignKey没有uniqueKey选项的问题
+ 修复Date类型插入时的bug
+ 修复getSelect获取mapping时，没用根据@Column等注释转换成dbname

## 0.0.3
###### 发布日期：2023-05-15
###### 兼容性：0.x.x

+ 版本同步


## 0.0.2
###### 发布日期：2023-05-15
###### 兼容性：0.x.x

+ 基础的CURD方法
+ DAO装饰器
+ 事务API与装饰器
+ 自动生成数据库表