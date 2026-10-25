import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import type { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import {
  FILTER_OPERATORS,
  VALUELESS_OPERATORS,
  type DatabaseViewFilter,
} from '../../../domain/constants/database-view-filter.constant';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import { InvalidDatabaseViewFilterException } from '../../../domain/exceptions/invalid-database-view-filter.exception';

import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';

import { SetViewFiltersCommand } from './set-view-filters.command';

const OPTION_PROPERTY_TYPES: ReadonlySet<PropertyType> = new Set([
  PropertyType.SELECT,
  PropertyType.STATUS,
  PropertyType.MULTI_SELECT,
]);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isValidFilterValue(
  property: DatabaseProperty,
  value: DatabaseViewFilter['value'],
): boolean {
  const type = property.getType();

  if (value === null || value === undefined) {
    return true;
  }

  if (type === PropertyType.NUMBER) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  if (type === PropertyType.DATE) {
    return (
      typeof value === 'string' &&
      ISO_DAY.test(value) &&
      !Number.isNaN(Date.parse(value))
    );
  }

  if (OPTION_PROPERTY_TYPES.has(type)) {
    return (
      typeof value === 'string' &&
      property.getOptions().some((option) => option.getId() === value)
    );
  }

  return typeof value === 'string' && value.length <= 500;
}

@Injectable()
export class SetViewFiltersHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(
    command: SetViewFiltersCommand,
  ): Promise<DatabaseViewDetailDto> {
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

    const properties = new Map(
      database.getProperties().map((property) => [property.getId(), property]),
    );

    for (const filter of command.filters) {
      const property = properties.get(filter.propertyId);

      if (!property) {
        throw new NotFoundException('Property does not belong to database');
      }

      const type = property.getType();

      if (!FILTER_OPERATORS[type]?.includes(filter.operator)) {
        throw new BadRequestException(
          `Operator ${filter.operator} is not allowed for ${type} properties`,
        );
      }

      if (
        !VALUELESS_OPERATORS.has(filter.operator) &&
        !isValidFilterValue(property, filter.value)
      ) {
        throw new BadRequestException(`Invalid value for ${type} filter`);
      }
    }

    try {
      view.setFilters(command.filters);
    } catch (error) {
      if (error instanceof InvalidDatabaseViewFilterException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    await this.databaseViewRepository.save(view);

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
