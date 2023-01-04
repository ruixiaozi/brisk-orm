import { BriskOrmDao, Dao } from "brisk-orm";
import { TestEntity } from "../entity/TestEntity";

@Dao(TestEntity)
export class TestDao extends BriskOrmDao<TestEntity> {

}
