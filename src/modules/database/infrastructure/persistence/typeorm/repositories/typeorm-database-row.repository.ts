import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/domain/persistence-context';

import { DatabaseRow } from '../../../../domain/aggregates/row/database-row.aggregate';

import { DatabaseRowRepository } from 'src/modules/database/domain/repositories/database-row.repository';
import { DatabaseRowOrmEntity } from '../entities/database-row.orm-entity';
import { RowValueOrmEntity } from '../entities/row-value.orm-entity';
import { DatabaseRowMapper } from '../mappers/database-row.mapper';

@Injectable()
export class TypeOrmDatabaseRowRepository implements DatabaseRowRepository {
  constructor(
    @InjectRepository(DatabaseRowOrmEntity)
    private readonly repository: Repository<DatabaseRowOrmEntity>,

    @InjectRepository(RowValueOrmEntity)
    private readonly rowValueRepository: Repository<RowValueOrmEntity>,
  ) {}

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<DatabaseRow | null> {
    const repository = this.getRowRepository(context);

    const entity = await repository.findOne({
      where: { id },
      relations: {
        values: true,
      },
    });

    if (!entity) {
      return null;
    }

    return DatabaseRowMapper.toDomain(entity);
  }

  async findByDatabaseId(
    databaseId: string,
    context?: PersistenceContext,
    options?: {
      limit?: number;
    },
  ): Promise<DatabaseRow[]> {
    const repository = this.getRowRepository(context);

    const entities = await repository.find({
      where: {
        databaseId,
      },
      relations: {
        values: true,
      },
      order: {
        position: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
      ...(options?.limit !== undefined
        ? {
            take: options.limit,
          }
        : {}),
    });

    return entities.map((entity) => DatabaseRowMapper.toDomain(entity));
  }

  async findMaxPosition(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<number | null> {
    const result = await this.getRowRepository(context)
      .createQueryBuilder('row')
      .select('MAX(row.position)', 'max')
      .where('row.databaseId = :databaseId', { databaseId })
      .getRawOne<{ max: number | string | null }>();

    return result?.max === null || result?.max === undefined
      ? null
      : Number(result.max);
  }

  async updatePositions(
    positions: { id: string; position: number }[],
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.getRowRepository(context);

    for (const { id, position } of positions) {
      await repository.update({ id }, { position });
    }
  }

  async save(row: DatabaseRow, context?: PersistenceContext): Promise<void> {
    const repository = this.getRowRepository(context);
    const entity = DatabaseRowMapper.toOrm(row);

    await repository.save(entity);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    const repository = this.getRowRepository(context);

    await repository.delete(id);
  }

  async deleteValue(
    rowId: string,
    propertyId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.getRowValueRepository(context);

    await repository.delete({
      rowId,
      propertyId,
    });
  }

  async isPropertyOptionInUse(
    propertyId: string,
    optionId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.getRowValueRepository(context);

    const count = await repository
      .createQueryBuilder('rowValue')
      .where('rowValue.propertyId = :propertyId', {
        propertyId,
      })
      .andWhere(
        `(
          rowValue.value = CAST(:scalarValue AS jsonb)
          OR
          rowValue.value @> CAST(:arrayValue AS jsonb)
        )`,
        {
          scalarValue: JSON.stringify(optionId),
          arrayValue: JSON.stringify([optionId]),
        },
      )
      .getCount();

    return count > 0;
  }

  private getRowRepository(
    context?: PersistenceContext,
  ): Repository<DatabaseRowOrmEntity> {
    if (!context) {
      return this.repository;
    }

    return (context as EntityManager).getRepository(DatabaseRowOrmEntity);
  }

  private getRowValueRepository(
    context?: PersistenceContext,
  ): Repository<RowValueOrmEntity> {
    if (!context) {
      return this.rowValueRepository;
    }

    return (context as EntityManager).getRepository(RowValueOrmEntity);
  }

  async countByDatabaseId(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    const repository = this.getRowRepository(context);

    return repository.count({
      where: {
        databaseId,
      },
    });
  }
}
