import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  async findById(id: string): Promise<DatabaseRow | null> {
    const entity = await this.repository.findOne({
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

  async findByDatabaseId(databaseId: string): Promise<DatabaseRow[]> {
    const entities = await this.repository.find({
      where: { databaseId },
      relations: {
        values: true,
      },
    });

    return entities.map((entity) => DatabaseRowMapper.toDomain(entity));
  }

  async save(row: DatabaseRow): Promise<void> {
    const entity = DatabaseRowMapper.toOrm(row);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteValue(rowId: string, propertyId: string): Promise<void> {
    await this.rowValueRepository.delete({
      rowId,
      propertyId,
    });
  }

  async isPropertyOptionInUse(
    propertyId: string,
    optionId: string,
  ): Promise<boolean> {
    const count = await this.rowValueRepository
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
}
