import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { AddPropertyOptionCommand } from './add-property-option.command';
import { PersistenceContext } from 'src/shared/domain/persistence-context';

@Injectable()
export class AddPropertyOptionHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(
    command: AddPropertyOptionCommand,
    context?: PersistenceContext,
  ): Promise<PropertyOption> {
    const database = await this.databaseRepository.findById(command.databaseId, context,);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const property = database
      .getProperties()
      .find((item) => item.getId() === command.propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const option = new PropertyOption(
      randomUUID(),
      command.name,
      command.color,
      String(property.getOptions().length),
    );

    property.addOption(option);

    await this.databaseRepository.save(database, context);

    return option;
  }
}
