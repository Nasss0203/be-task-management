import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';
import { RenameDatabaseCommand } from './rename-database.command';
import type { DatabaseActivityRecorder } from '../../ports/database-activity-recorder.port';

@Injectable()
export class RenameDatabaseHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
    @Inject(DATABASE_TYPES.ports.DatabaseActivityRecorder)
    private readonly activityRecorder: DatabaseActivityRecorder,
  ) {}

  async execute(
    command: RenameDatabaseCommand,
  ): Promise<{ id: string; name: string }> {
    const name = command.name.trim();

    if (!name) {
      throw new BadRequestException('Database name is required');
    }

    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    if (database.getName() !== name) {
      database.rename(name);
      await this.databaseRepository.save(database);
      await this.activityRecorder.record({
        actorId: command.actorId,
        databaseId: database.getId(),
        action: 'DATABASE_RENAMED',
        field: 'name',
      });
    }

    return { id: database.getId(), name: database.getName() };
  }
}
