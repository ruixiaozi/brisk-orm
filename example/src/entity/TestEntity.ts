import { Column, PrimaryKey, Table } from "brisk-orm";

@Table('test')
export class TestEntity {
  @PrimaryKey('name')
  myName?: string;

  @Column('age')
  myAge?: number;
}
