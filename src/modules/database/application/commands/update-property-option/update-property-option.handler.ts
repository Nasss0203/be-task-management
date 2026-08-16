import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { DatabasePropertyNotFoundException } from 'src/modules/database/domain/exceptions/database-property-not-found.exception';
import { DuplicatePropertyOptionNameException } from 'src/modules/database/domain/exceptions/duplicate-property-option-name.exception';
import { PropertyOptionNotFoundException } from 'src/modules/database/domain/exceptions/property-option-not-found.exception';
import { type DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PropertyOptionDto } from '../../dto/database-property.dto';
import { UpdatePropertyOptionCommand } from './update-property-option.command';

@Injectable()
export class UpdatePropertyOptionHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(
    command: UpdatePropertyOptionCommand,
  ): Promise<PropertyOptionDto> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    try {
      const option = database.updatePropertyOption(
        command.propertyId,
        command.optionId,
        command.name,
        command.color,
      );

      await this.databaseRepository.save(database);

      return {
        id: option.getId(),
        name: option.getName(),
        color: option.getColor(),
        position: option.getPosition(),
      };
    } catch (error) {
      if (error instanceof DatabasePropertyNotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PropertyOptionNotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof DuplicatePropertyOptionNameException) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
