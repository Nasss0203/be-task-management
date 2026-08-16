import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { DatabasePropertyNotFoundException } from '../../../domain/exceptions/database-property-not-found.exception';
import { PropertyOptionInUseException } from '../../../domain/exceptions/property-option-in-use.exception';
import { PropertyOptionNotFoundException } from '../../../domain/exceptions/property-option-not-found.exception';

import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DeletePropertyOptionCommand } from './delete-property-option.command';

@Injectable()
export class DeletePropertyOptionHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(command: DeletePropertyOptionCommand): Promise<void> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    try {
      // Chỉ đọc để xác minh Property/Option tồn tại.
      const property = database
        .getProperties()
        .find((item) => item.getId() === command.propertyId);

      if (!property) {
        throw new DatabasePropertyNotFoundException();
      }

      const option = property
        .getOptions()
        .find((item) => item.getId() === command.optionId);

      if (!option) {
        throw new PropertyOptionNotFoundException();
      }

      const isInUse = await this.databaseRowRepository.isPropertyOptionInUse(
        command.propertyId,
        command.optionId,
      );

      if (isInUse) {
        throw new PropertyOptionInUseException();
      }

      database.removePropertyOption(command.propertyId, command.optionId);

      await this.databaseRepository.deletePropertyOption(command.optionId);
    } catch (error) {
      if (error instanceof DatabasePropertyNotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PropertyOptionNotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PropertyOptionInUseException) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
