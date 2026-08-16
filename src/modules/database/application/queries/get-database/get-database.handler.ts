import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { GetDatabaseQuery } from './get-database.query';

@Injectable()
export class GetDatabaseHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(query: GetDatabaseQuery) {
    const database = await this.databaseRepository.findById(query.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    return database;
  }
}
