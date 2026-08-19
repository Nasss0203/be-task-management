import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';
import { DatabaseView } from '../../../domain/aggregates/view/database-view.aggregate';
import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';
import { DatabaseViewDto } from '../../dto/database-view.dto';
import { CreateDatabaseViewCommand } from './create-database-view.command';

@Injectable()
export class CreateDatabaseViewHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(command: CreateDatabaseViewCommand): Promise<DatabaseViewDto> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const views = await this.databaseViewRepository.findByDatabaseId(
      command.databaseId,
    );

    const view = DatabaseView.create({
      id: randomUUID(),
      databaseId: command.databaseId,
      name: command.name,
      type: command.type,
      position: String(views.length),
    });

    const properties = database.getProperties();

    properties.forEach((property, index) => {
      view.addProperty({
        id: randomUUID(),
        propertyId: property.getId(),
        position: String(index),
        visible: true,
        width: null,
      });
    });

    await this.databaseViewRepository.save(view);

    return DatabaseViewDto.fromDomain(view);
  }
}
