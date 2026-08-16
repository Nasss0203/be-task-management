import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  async findById(id: string): Promise<Database | null> {
    const entity = await this.repository.findOne({
      where: {
        id,
      },
      relations: {
        properties: {
          options: true,
        },
      },
    });

    if (!entity) {
      return null;
    }

    return DatabaseMapper.toDomain(entity);
  }

  async findByPageId(pageId: string): Promise<Database[]> {
    const entities = await this.repository.find({
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

  async save(database: Database): Promise<void> {
    const entity = DatabaseMapper.toOrm(database);

    await this.repository.save(entity);
  }

  async deleteProperty(propertyId: string): Promise<void> {
    await this.propertyRepository.delete(propertyId);
  }

  async deletePropertyOption(optionId: string): Promise<void> {
    await this.propertyOptionRepository.delete(optionId);
  }
}
