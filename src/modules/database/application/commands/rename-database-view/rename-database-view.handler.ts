import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import type { DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';

import { DatabaseViewDto } from '../../dto/database-view.dto';

import { RenameDatabaseViewCommand } from './rename-database-view.command';

@Injectable()
export class RenameDatabaseViewHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(command: RenameDatabaseViewCommand): Promise<DatabaseViewDto> {
    const view = await this.databaseViewRepository.findById(command.viewId);

    if (!view) {
      throw new NotFoundException('Database view not found');
    }

    if (view.getDatabaseId() !== command.databaseId) {
      throw new BadRequestException(
        'Database view does not belong to this database',
      );
    }

    view.rename(command.name);

    await this.databaseViewRepository.save(view);

    return DatabaseViewDto.fromDomain(view);
  }
}
