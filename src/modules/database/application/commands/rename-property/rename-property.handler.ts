import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { DatabasePropertyNotFoundException } from '../../../domain/exceptions/database-property-not-found.exception';
import { DuplicatePropertyNameException } from '../../../domain/exceptions/duplicate-property-name.exception';
import { InvalidPropertyNameException } from '../../../domain/exceptions/invalid-property-name.exception';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';
import { DatabasePropertyDto } from '../../dto/database-property.dto';
import { RenamePropertyCommand } from './rename-property.command';

@Injectable()
export class RenamePropertyHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(command: RenamePropertyCommand): Promise<DatabasePropertyDto> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    try {
      const property = database.renameProperty(
        command.propertyId,
        command.name,
      );

      await this.databaseRepository.save(database);

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
    } catch (error) {
      if (error instanceof DatabasePropertyNotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof DuplicatePropertyNameException) {
        throw new ConflictException(error.message);
      }

      if (error instanceof InvalidPropertyNameException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
