import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';
import { RenameDatabaseCommand } from './rename-database.command';

@Injectable()
export class RenameDatabaseHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(
    command: RenameDatabaseCommand,
  ): Promise<{ id: string; name: string }> {
    const name = command.name.trim();

    if (!name) {
      throw new BadRequestException('Database name is required');
    }

    const database = await this.databaseRepository.findById(
      command.databaseId,
    );

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    if (database.getName() !== name) {
      database.rename(name);
      await this.databaseRepository.save(database);
    }

    return { id: database.getId(), name: database.getName() };
  }
}
