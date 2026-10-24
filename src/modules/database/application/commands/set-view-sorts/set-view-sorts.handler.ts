import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { PropertyType } from '../../../domain/enums/property-type.enum';
import { InvalidDatabaseViewSortException } from '../../../domain/exceptions/invalid-database-view-sort.exception';

import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';

import { SetViewSortsCommand } from './set-view-sorts.command';

export const SORTABLE_PROPERTY_TYPES: ReadonlySet<PropertyType> = new Set([
  PropertyType.TITLE,
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.SELECT,
  PropertyType.STATUS,
  PropertyType.DATE,
  PropertyType.CHECKBOX,
  PropertyType.URL,
  PropertyType.EMAIL,
  PropertyType.PHONE,
]);

@Injectable()
export class SetViewSortsHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(command: SetViewSortsCommand): Promise<DatabaseViewDetailDto> {
    const view = await this.databaseViewRepository.findById(command.viewId);

    if (!view) {
      throw new NotFoundException('Database view not found');
    }

    if (view.getDatabaseId() !== command.databaseId) {
      throw new BadRequestException(
        'Database view does not belong to this database',
      );
    }

    const database = await this.databaseRepository.findById(
      command.databaseId,
    );

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const propertyTypes = new Map(
      database
        .getProperties()
        .map((property) => [property.getId(), property.getType()]),
    );

    for (const sort of command.sorts) {
      const type = propertyTypes.get(sort.propertyId);

      if (!type) {
        throw new NotFoundException('Property does not belong to database');
      }

      if (!SORTABLE_PROPERTY_TYPES.has(type)) {
        throw new BadRequestException(`${type} properties cannot be sorted`);
      }
    }

    try {
      view.setSorts(command.sorts);
    } catch (error) {
      if (error instanceof InvalidDatabaseViewSortException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    await this.databaseViewRepository.save(view);

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
