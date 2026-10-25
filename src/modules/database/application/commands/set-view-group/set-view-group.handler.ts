import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { PropertyType } from '../../../domain/enums/property-type.enum';

import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';

import { SetViewGroupCommand } from './set-view-group.command';

export const GROUPABLE_PROPERTY_TYPES: ReadonlySet<PropertyType> = new Set([
  PropertyType.STATUS,
  PropertyType.SELECT,
  PropertyType.CHECKBOX,
]);

@Injectable()
export class SetViewGroupHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(command: SetViewGroupCommand): Promise<DatabaseViewDetailDto> {
    const view = await this.databaseViewRepository.findById(command.viewId);

    if (!view) {
      throw new NotFoundException('Database view not found');
    }

    if (view.getDatabaseId() !== command.databaseId) {
      throw new BadRequestException(
        'Database view does not belong to this database',
      );
    }

    if (command.propertyId !== null) {
      const database = await this.databaseRepository.findById(
        command.databaseId,
      );

      if (!database) {
        throw new NotFoundException('Database not found');
      }

      const property = database
        .getProperties()
        .find((item) => item.getId() === command.propertyId);

      if (!property) {
        throw new NotFoundException('Property does not belong to database');
      }

      if (!GROUPABLE_PROPERTY_TYPES.has(property.getType())) {
        throw new BadRequestException(
          `${property.getType()} properties cannot be used to group rows`,
        );
      }
    }

    view.setGroupBy(command.propertyId);
    await this.databaseViewRepository.save(view);

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
