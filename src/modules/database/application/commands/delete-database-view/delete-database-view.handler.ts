import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import type { DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';

import { DeleteDatabaseViewCommand } from './delete-database-view.command';

@Injectable()
export class DeleteDatabaseViewHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(command: DeleteDatabaseViewCommand): Promise<void> {
    const view = await this.databaseViewRepository.findById(command.viewId);

    if (!view) {
      throw new NotFoundException('Database view not found');
    }

    if (view.getDatabaseId() !== command.databaseId) {
      throw new BadRequestException(
        'Database view does not belong to this database',
      );
    }

    const views = await this.databaseViewRepository.findByDatabaseId(
      command.databaseId,
    );

    if (views.length <= 1) {
      throw new BadRequestException('Database must have at least one view');
    }

    await this.databaseViewRepository.delete(command.viewId);
  }
}
