import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { GetDatabaseRowsQuery } from './get-database-rows.query';

@Injectable()
export class GetDatabaseRowsHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(query: GetDatabaseRowsQuery) {
    const database = await this.databaseRepository.findById(query.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    return this.databaseRowRepository.findByDatabaseId(query.databaseId);
  }
}
