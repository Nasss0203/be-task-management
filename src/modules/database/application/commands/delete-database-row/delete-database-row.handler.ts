import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';

import { DeleteDatabaseRowCommand } from './delete-database-row.command';

@Injectable()
export class DeleteDatabaseRowHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(command: DeleteDatabaseRowCommand): Promise<void> {
    const row = await this.databaseRowRepository.findById(command.rowId);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    await this.databaseRowRepository.delete(row.getId());
  }
}
