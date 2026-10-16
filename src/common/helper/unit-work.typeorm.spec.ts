import type { DataSource, EntityManager } from 'typeorm';

import { TypeOrmUnitOfWork } from './unit-work.typeorm';

describe('TypeOrmUnitOfWork', () => {
  let manager: EntityManager;

  let dataSource: {
    transaction: jest.Mock;
  };

  let unitOfWork: TypeOrmUnitOfWork;

  beforeEach(() => {
    manager = {
      query: jest.fn(),
    } as unknown as EntityManager;

    dataSource = {
      transaction: jest.fn(
        async <T>(
          callback: (manager: EntityManager) => Promise<T>,
        ): Promise<T> => callback(manager),
      ),
    };

    unitOfWork = new TypeOrmUnitOfWork(dataSource as unknown as DataSource);
  });

  it('runs the callback inside a TypeORM transaction', async () => {
    const result = await unitOfWork.runInTransaction(async (context) => {
      expect(context).toBe(manager);

      return 'done';
    });

    expect(result).toBe('done');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('reuses the active transaction context for nested transactions', async () => {
    await unitOfWork.runInTransaction(async (outerContext) => {
      expect(outerContext).toBe(manager);

      await unitOfWork.runInTransaction(async (innerContext) => {
        expect(innerContext).toBe(manager);
        expect(innerContext).toBe(outerContext);
      });
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('propagates an error from the transaction callback', async () => {
    const error = new Error('Transaction operation failed');

    await expect(
      unitOfWork.runInTransaction(async (context) => {
        expect(context).toBe(manager);

        throw error;
      }),
    ).rejects.toBe(error);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('propagates a nested transaction error through the outer transaction', async () => {
    const error = new Error('Nested operation failed');

    await expect(
      unitOfWork.runInTransaction(async (outerContext) => {
        expect(outerContext).toBe(manager);

        await unitOfWork.runInTransaction(async (innerContext) => {
          expect(innerContext).toBe(manager);

          throw error;
        });
      }),
    ).rejects.toBe(error);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});
