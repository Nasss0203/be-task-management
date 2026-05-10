import { Injectable } from '@nestjs/common';
import { UnitOfWork } from 'src/interface/index.interface';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async runInTransaction<T>(
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return fn(manager);
    });
  }
}
