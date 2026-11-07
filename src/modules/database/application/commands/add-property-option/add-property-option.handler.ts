import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { AddPropertyOptionCommand } from './add-property-option.command';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { DatabaseActivityRecorder } from '../../ports/database-activity-recorder.port';

@Injectable()
export class AddPropertyOptionHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
    @Inject(DATABASE_TYPES.ports.DatabaseActivityRecorder)
    private readonly activityRecorder: DatabaseActivityRecorder,
  ) {}

  async execute(
    command: AddPropertyOptionCommand,
    context?: PersistenceContext,
  ): Promise<PropertyOption> {
    const database = await this.databaseRepository.findById(
      command.databaseId,
      context,
    );

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
    await this.activityRecorder.record(
      {
        actorId: command.actorId,
        databaseId: database.getId(),
        action: 'DATABASE_PROPERTY_UPDATED',
        propertyId: property.getId(),
        optionId: option.getId(),
        kind: 'OPTION_ADDED',
      },
      context,
    );

    return option;
  }
}
