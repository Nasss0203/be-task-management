import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';
import { GetDatabaseViewQuery } from './get-database-view.query';

@Injectable()
export class GetDatabaseViewHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(query: GetDatabaseViewQuery): Promise<DatabaseViewDetailDto> {
    const view = await this.databaseViewRepository.findById(query.viewId);

    if (!view) {
      throw new NotFoundException('Database view not found');
    }

    if (view.getDatabaseId() !== query.databaseId) {
      throw new BadRequestException(
        'Database view does not belong to this database',
      );
    }

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
