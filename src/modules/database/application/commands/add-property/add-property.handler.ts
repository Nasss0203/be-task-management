import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';
import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DatabasePropertyDto } from '../../dto/database-property.dto';
import { AddPropertyCommand } from './add-property.command';

@Injectable()
export class AddPropertyHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(command: AddPropertyCommand): Promise<DatabasePropertyDto> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }
    const property = new DatabaseProperty(
      randomUUID(),
      database.getId(),
      command.name,
      command.type,
      String(database.getProperties().length),
    );

    database.addProperty(property);

    await this.databaseRepository.save(database);

    return {
      id: property.getId(),
      databaseId: property.getDatabaseId(),
      name: property.getName(),
      type: property.getType(),
      position: property.getPosition(),

      options: property.getOptions().map((option) => ({
        id: option.getId(),
        name: option.getName(),
        color: option.getColor(),
        position: option.getPosition(),
      })),
    };
  }
}
