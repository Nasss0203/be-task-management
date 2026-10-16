import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/domain/persistence-context';

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

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<DatabaseView | null> {
    const repository = this.getRepository(context);

    const orm = await repository.findOne({
      where: { id },
      relations: {
        properties: true,
      },
    });

    return orm ? DatabaseViewMapper.toDomain(orm) : null;
  }

  async findByDatabaseId(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<DatabaseView[]> {
    const repository = this.getRepository(context);

    const views = await repository.find({
      where: {
        databaseId,
      },
      relations: {
        properties: true,
      },
      order: {
        position: 'ASC',
        id: 'ASC',
        properties: { position: 'ASC', id: 'ASC' },
      },
    });

    return views.map((view) => DatabaseViewMapper.toDomain(view));
  }

  async save(view: DatabaseView, context?: PersistenceContext): Promise<void> {
    const repository = this.getRepository(context);
    const orm = DatabaseViewMapper.toOrm(view);

    await repository.save(orm);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    const repository = this.getRepository(context);

    await repository.delete(id);
  }

  private getRepository(
    context?: PersistenceContext,
  ): Repository<DatabaseViewOrmEntity> {
    if (!context) {
      return this.repository;
    }

    return (context as EntityManager).getRepository(DatabaseViewOrmEntity);
  }
}
