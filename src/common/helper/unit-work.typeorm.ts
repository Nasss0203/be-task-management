import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';
import { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

const transactionAls = new AsyncLocalStorage<EntityManager>();

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async runInTransaction<T>(
    fn: (context: PersistenceContext) => Promise<T>,
  ): Promise<T> {
    const activeManager = transactionAls.getStore();

    if (activeManager) {
      return fn(activeManager as unknown);
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      return transactionAls.run(manager, () => {
        return fn(manager as unknown);
      });
    });
  }
}
