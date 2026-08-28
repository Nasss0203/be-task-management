import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { CannotDeleteDefaultPropertyException } from '../../../domain/exceptions/cannot-delete-default-property.exception';
import { DatabasePropertyNotFoundException } from '../../../domain/exceptions/database-property-not-found.exception';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DeletePropertyCommand } from './delete-property.command';

@Injectable()
export class DeletePropertyHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(command: DeletePropertyCommand): Promise<void> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    try {
      database.removeProperty(command.propertyId);

      await this.databaseRepository.deleteProperty(command.propertyId);
    } catch (error) {
      if (error instanceof DatabasePropertyNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      if (error instanceof CannotDeleteDefaultPropertyException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
