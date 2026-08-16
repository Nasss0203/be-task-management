import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';

import { RowValue } from '../../../domain/aggregates/row/row-value.entity';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { SetRowValueCommand } from './set-row-value.command';

@Injectable()
export class SetRowValueHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(command: SetRowValueCommand): Promise<RowValue> {
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

    const rowValue = new RowValue(
      randomUUID(),
      row.getId(),
      property.getId(),
      command.value,
    );

    try {
      const savedValue = row.setValue(property, rowValue);

      await this.databaseRowRepository.save(row);

      return savedValue;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
