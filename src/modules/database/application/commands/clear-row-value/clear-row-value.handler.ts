import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { ClearRowValueCommand } from './clear-row-value.command';

@Injectable()
export class ClearRowValueHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(command: ClearRowValueCommand): Promise<void> {
    const row = await this.databaseRowRepository.findById(command.rowId);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    const database = await this.databaseRepository.findById(
      row.getDatabaseId(),
    );

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const property = database
      .getProperties()
      .find((item) => item.getId() === command.propertyId);

    if (!property) {
      throw new NotFoundException('Database property not found');
    }

    await this.databaseRowRepository.deleteValue(row.getId(), property.getId());
  }
}
