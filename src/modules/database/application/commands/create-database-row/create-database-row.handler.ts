import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';

import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { CreateDatabaseRowCommand } from './create-database-row.command';

@Injectable()
export class CreateDatabaseRowHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(
    command: CreateDatabaseRowCommand,
    context?: PersistenceContext,
  ): Promise<DatabaseRow> {
    const database = await this.databaseRepository.findById(
      command.databaseId,
      context,
    );

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const row = DatabaseRow.create({
      id: randomUUID(),
      databaseId: database.getId(),
    });

    await this.databaseRowRepository.save(row, context);

    return row;
  }
}
