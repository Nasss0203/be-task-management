import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { InvalidDatabaseViewPropertyOrderException } from '../../../domain/exceptions/invalid-database-view-property-order.exception';

import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';

import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';

import { ReorderViewPropertiesCommand } from './reorder-view-properties.command';

@Injectable()
export class ReorderViewPropertiesHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(
    command: ReorderViewPropertiesCommand,
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

    try {
      view.reorderProperties(command.propertyIds);
    } catch (error) {
      if (error instanceof InvalidDatabaseViewPropertyOrderException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    await this.databaseViewRepository.save(view);

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
