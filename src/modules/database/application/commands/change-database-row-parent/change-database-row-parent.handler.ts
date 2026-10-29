import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';

import { ChangeDatabaseRowParentCommand } from './change-database-row-parent.command';
import { wouldCreateCycle } from './row-tree';

@Injectable()
export class ChangeDatabaseRowParentHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(
    command: ChangeDatabaseRowParentCommand,
  ): Promise<{ id: string; parentRowId: string | null }> {
    const row = await this.databaseRowRepository.findById(command.rowId);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    if (command.parentRowId !== null) {
      const rows = await this.databaseRowRepository.findByDatabaseId(
        row.getDatabaseId(),
      );
      const tree = rows.map((item) => ({
        id: item.getId(),
        parentRowId: item.getParentRowId(),
      }));

      if (!tree.some((item) => item.id === command.parentRowId)) {
        throw new BadRequestException(
          'Parent row must belong to the same database',
        );
      }

      if (wouldCreateCycle(tree, row.getId(), command.parentRowId)) {
        throw new BadRequestException(
          'A row cannot be moved under itself or its sub-tasks',
        );
      }
    }

    row.changeParent(command.parentRowId);
    await this.databaseRowRepository.save(row);

    return { id: row.getId(), parentRowId: row.getParentRowId() };
  }
}
