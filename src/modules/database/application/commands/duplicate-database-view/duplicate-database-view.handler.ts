import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';
import { DatabaseView } from '../../../domain/aggregates/view/database-view.aggregate';
import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { DatabaseViewDto } from '../../dto/database-view.dto';
import { DuplicateDatabaseViewCommand } from './duplicate-database-view.command';

const MAX_VIEW_NAME_LENGTH = 255;
const COPY_SUFFIX = ' (copy)';

@Injectable()
export class DuplicateDatabaseViewHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async execute(
    command: DuplicateDatabaseViewCommand,
  ): Promise<DatabaseViewDto> {
    const source = await this.databaseViewRepository.findById(command.viewId);

    if (!source || source.getDatabaseId() !== command.databaseId) {
      throw new NotFoundException('Database view not found');
    }

    const views = await this.databaseViewRepository.findByDatabaseId(
      command.databaseId,
    );

    const copy = DatabaseView.create({
      id: randomUUID(),
      databaseId: command.databaseId,
      name: copyName(source.getName()),
      type: source.getType(),
      position: String(views.length),
    });

    source.getProperties().forEach((property) => {
      copy.addProperty({
        id: randomUUID(),
        propertyId: property.getPropertyId(),
        position: property.getPosition(),
        visible: property.isVisible(),
        width: property.getWidth(),
      });
    });
    copy.setSorts(source.getSorts());
    copy.setFilters(source.getFilters());
    copy.setGroupBy(source.getGroupBy());

    await this.databaseViewRepository.save(copy);

    return DatabaseViewDto.fromDomain(copy);
  }
}

function copyName(name: string): string {
  return name.slice(0, MAX_VIEW_NAME_LENGTH - COPY_SUFFIX.length) + COPY_SUFFIX;
}
