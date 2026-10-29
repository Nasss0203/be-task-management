import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { DatabaseRowDto } from '../../dto/database-row.dto';

import { type DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';

import { GetDatabaseRowQuery } from './get-database-row.query';

/** One task, e.g. to open it full page from its link. */
@Injectable()
export class GetDatabaseRowHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
  ) {}

  async execute(query: GetDatabaseRowQuery): Promise<DatabaseRowDto> {
    const row = await this.databaseRowRepository.findById(query.rowId);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    return DatabaseRowDto.fromDomain(row);
  }
}
