import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { DATABASE_TYPES } from '../../../database.types';
import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';
import { CreateDatabaseCommand } from './create-database.command';

@Injectable()
export class CreateDatabaseHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(
    command: CreateDatabaseCommand,
    context?: PersistenceContext,
  ): Promise<Database> {
    const database = Database.create({
      id: randomUUID(),
      pageId: command.pageId,
      name: command.name,

      titlePropertyId: randomUUID(),
      assigneePropertyId: randomUUID(),
      dueDatePropertyId: randomUUID(),
    });

    await this.databaseRepository.save(database, context);

    return database;
  }
}
