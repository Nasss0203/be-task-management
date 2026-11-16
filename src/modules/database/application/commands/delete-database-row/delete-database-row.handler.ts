import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';

import { DeleteDatabaseRowCommand } from './delete-database-row.command';
import type { DatabaseActivityRecorder } from '../../ports/database-activity-recorder.port';
import type { DatabaseRowChangePublisher } from '../../ports/database-row-change-publisher.port';

@Injectable()
export class DeleteDatabaseRowHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
    @Inject(DATABASE_TYPES.ports.DatabaseActivityRecorder)
    private readonly activityRecorder: DatabaseActivityRecorder,
    @Inject(DATABASE_TYPES.ports.DatabaseRowChangePublisher)
    private readonly rowChangePublisher: DatabaseRowChangePublisher,
  ) {}

  async execute(command: DeleteDatabaseRowCommand): Promise<void> {
    const row = await this.databaseRowRepository.findById(command.rowId);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    await this.databaseRowRepository.delete(row.getId());
    await this.activityRecorder.record({
      actorId: command.actorId,
      databaseId: row.getDatabaseId(),
      action: 'DATABASE_ROW_DELETED',
      rowId: row.getId(),
    });
    this.rowChangePublisher.publish(row.getDatabaseId());
  }
}
