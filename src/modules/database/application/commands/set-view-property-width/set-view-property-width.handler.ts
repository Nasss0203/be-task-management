import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { DatabaseViewPropertyNotFoundException } from '../../../domain/exceptions/database-view-property-not-found.exception';

import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';

import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';

import { SetViewPropertyWidthCommand } from './set-view-property-width.command';

@Injectable()
export class SetViewPropertyWidthHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(
    command: SetViewPropertyWidthCommand,
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
      view.setPropertyWidth(command.propertyId, command.width);
    } catch (error) {
      if (error instanceof DatabaseViewPropertyNotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    await this.databaseViewRepository.save(view);

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
