import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';

import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';

import { PropertyType } from '../../../domain/enums/property-type.enum';

import type { DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';

import type { DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DatabasePropertyDto } from '../../dto/database-property.dto';

import { DEFAULT_STATUS_OPTIONS } from 'src/modules/database/domain/constants/default-property-options.constant';
import { AddPropertyCommand } from './add-property.command';

@Injectable()
export class AddPropertyHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
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
      false,
      true,
      String(database.getProperties().length),
    );

    if (command.type === PropertyType.STATUS) {
      for (const [index, option] of DEFAULT_STATUS_OPTIONS.entries()) {
        property.addOption(
          new PropertyOption(
            randomUUID(),
            option.name,
            option.color,
            String(index),
          ),
        );
      }
    }

    database.addProperty(property);

    await this.databaseRepository.save(database);

    const views = await this.databaseViewRepository.findByDatabaseId(
      command.databaseId,
    );

    for (const view of views) {
      view.addProperty({
        id: randomUUID(),
        propertyId: property.getId(),
        position: String(view.getProperties().length),
        visible: true,
        width: null,
      });

      await this.databaseViewRepository.save(view);
    }

    return {
      id: property.getId(),
      databaseId: property.getDatabaseId(),
      name: property.getName(),
      type: property.getType(),
      isDefault: property.getIsDefault(),
      isHideable: property.getIsHideable(),
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
