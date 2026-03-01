import { Injectable } from '@nestjs/common';
import { UnitOfWork } from 'src/interface/index.interface';
import { DataSource } from 'typeorm';

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async () => fn());
  }
}
