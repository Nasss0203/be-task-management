import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/domain/persistence-context';

import { Database } from '../../../../domain/aggregates/database/database.aggregate';
import { DatabaseRepository } from '../../../../domain/repositories/database.repository';

import { DatabasePropertyOrmEntity } from '../entities/database-property.orm-entity';
import { DatabaseOrmEntity } from '../entities/database.orm-entity';
import { PropertyOptionOrmEntity } from '../entities/property-option.orm-entity';
import { DatabaseMapper } from '../mappers/database.mapper';

@Injectable()
export class TypeOrmDatabaseRepository implements DatabaseRepository {
  constructor(
    @InjectRepository(DatabaseOrmEntity)
    private readonly repository: Repository<DatabaseOrmEntity>,

    @InjectRepository(DatabasePropertyOrmEntity)
    private readonly propertyRepository: Repository<DatabasePropertyOrmEntity>,

    @InjectRepository(PropertyOptionOrmEntity)
    private readonly propertyOptionRepository: Repository<PropertyOptionOrmEntity>,
  ) {}

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<Database | null> {
    const repository = this.getDatabaseRepository(context);

    const entity = await repository.findOne({
      where: {
        id,
      },
      relations: {
        properties: {
          options: true,
        },
      },
      // Relations have business positions; never depend on SQL join order.
      order: {
        properties: {
          position: 'ASC',
          id: 'ASC',
          options: { position: 'ASC', id: 'ASC' },
        },
      },
    });

    if (!entity) {
      return null;
    }

    return DatabaseMapper.toDomain(entity);
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<Database[]> {
    const repository = this.getDatabaseRepository(context);

    const entities = await repository.find({
      where: {
        pageId,
      },
      relations: {
        properties: {
          options: true,
        },
      },
    });

    return entities.map((entity) => DatabaseMapper.toDomain(entity));
  }

  async save(database: Database, context?: PersistenceContext): Promise<void> {
    const repository = this.getDatabaseRepository(context);
    const entity = DatabaseMapper.toOrm(database);

    await repository.save(entity);
  }

  async deleteProperty(
    propertyId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.getPropertyRepository(context);

    await repository.delete(propertyId);
  }

  async deletePropertyOption(
    optionId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.getPropertyOptionRepository(context);

    await repository.delete(optionId);
  }

  private getDatabaseRepository(
    context?: PersistenceContext,
  ): Repository<DatabaseOrmEntity> {
    if (!context) {
      return this.repository;
    }

    return (context as EntityManager).getRepository(DatabaseOrmEntity);
  }

  private getPropertyRepository(
    context?: PersistenceContext,
  ): Repository<DatabasePropertyOrmEntity> {
    if (!context) {
      return this.propertyRepository;
    }

    return (context as EntityManager).getRepository(DatabasePropertyOrmEntity);
  }

  private getPropertyOptionRepository(
    context?: PersistenceContext,
  ): Repository<PropertyOptionOrmEntity> {
    if (!context) {
      return this.propertyOptionRepository;
    }

    return (context as EntityManager).getRepository(PropertyOptionOrmEntity);
  }
}
