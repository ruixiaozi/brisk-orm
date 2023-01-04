import { AutoWrite, Service } from "brisk-ioc";
import { TestDao } from "../dao/TestDao";

@Service()
export class TestService {

  @AutoWrite()
  testDao?: TestDao;

  getAll() {
    return this.testDao?.findList();
  }
}
