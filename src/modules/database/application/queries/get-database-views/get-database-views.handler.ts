import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';
import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';
import { GetDatabaseViewsQuery } from './get-database-views.query';

@Injectable()
export class GetDatabaseViewsHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(
    query: GetDatabaseViewsQuery,
  ): Promise<DatabaseViewDetailDto[]> {
    const database = await this.databaseRepository.findById(query.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const views = await this.databaseViewRepository.findByDatabaseId(
      query.databaseId,
    );

    return views.map(DatabaseViewDetailDto.fromDomain);
  }
}
