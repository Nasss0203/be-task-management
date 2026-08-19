import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DatabaseView } from '../../../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewRepository } from '../../../../domain/repositories/database-view.repository';
import { DatabaseViewOrmEntity } from '../entities/database-view.orm-entity';
import { DatabaseViewMapper } from '../mappers/database-view.mapper';

@Injectable()
export class TypeOrmDatabaseViewRepository implements DatabaseViewRepository {
  constructor(
    @InjectRepository(DatabaseViewOrmEntity)
    private readonly repository: Repository<DatabaseViewOrmEntity>,
  ) {}

  async findById(id: string): Promise<DatabaseView | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: {
        properties: true,
      },
    });

    return orm ? DatabaseViewMapper.toDomain(orm) : null;
  }

  async findByDatabaseId(databaseId: string): Promise<DatabaseView[]> {
    const views = await this.repository.find({
      where: {
        databaseId,
      },
      relations: {
        properties: true,
      },
      order: {
        position: 'ASC',
      },
    });

    return views.map(DatabaseViewMapper.toDomain);
  }

  async save(view: DatabaseView): Promise<void> {
    const orm = DatabaseViewMapper.toOrm(view);

    await this.repository.save(orm);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
