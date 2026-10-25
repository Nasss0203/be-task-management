import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';

import { MoveDatabaseRowCommand } from './move-database-row.command';
import { planRowMove } from './row-position';

@Injectable()
export class MoveDatabaseRowHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(
    command: MoveDatabaseRowCommand,
  ): Promise<{ id: string; position: number }> {
    const row = await this.databaseRowRepository.findById(command.rowId);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    const rows = await this.databaseRowRepository.findByDatabaseId(
      row.getDatabaseId(),
    );
    const rowIds = new Set(rows.map((item) => item.getId()));

    for (const neighbourId of [command.previousRowId, command.nextRowId]) {
      if (
        neighbourId !== null &&
        (neighbourId === row.getId() || !rowIds.has(neighbourId))
      ) {
        throw new BadRequestException(
          'Neighbour rows must be other rows of the same database',
        );
      }
    }

    const plan = planRowMove(
      rows.map((item) => ({ id: item.getId(), position: item.getPosition() })),
      row.getId(),
      command.previousRowId,
      command.nextRowId,
    );

    if (plan.kind === 'single') {
      row.moveTo(plan.position);
      await this.databaseRowRepository.updatePositions([
        { id: row.getId(), position: plan.position },
      ]);
      return { id: row.getId(), position: plan.position };
    }

    await this.databaseRowRepository.updatePositions(plan.positions);

    return {
      id: row.getId(),
      position: plan.positions.find((item) => item.id === row.getId())!.position,
    };
  }
}
