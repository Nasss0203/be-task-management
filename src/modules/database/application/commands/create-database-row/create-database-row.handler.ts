import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DATABASE_TYPES } from '../../../database.types';
import { DatabaseRowDto } from '../../dto/database-row.dto';

import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { RowValue } from '../../../domain/aggregates/row/row-value.entity';
import { PropertyType } from '../../../domain/enums/property-type.enum';
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
  ): Promise<DatabaseRowDto> {
    const database = await this.databaseRepository.findById(
      command.databaseId,
      context,
    );

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    if (command.parentRowId) {
      const parent = await this.databaseRowRepository.findById(
        command.parentRowId,
        context,
      );

      if (!parent || parent.getDatabaseId() !== database.getId()) {
        throw new BadRequestException(
          'Parent row must belong to the same database',
        );
      }
    }

    const maxPosition = await this.databaseRowRepository.findMaxPosition(
      database.getId(),
      context,
    );

    const row = DatabaseRow.create({
      id: randomUUID(),
      databaseId: database.getId(),
      position: (maxPosition ?? 0) + 1,
      parentRowId: command.parentRowId,
    });

    for (const property of database.getProperties()) {
      const option =
        property.getType() === PropertyType.STATUS
          ? property.getDefaultOption()
          : undefined;
      if (option) {
        row.setValue(
          property,
          new RowValue(
            randomUUID(),
            row.getId(),
            property.getId(),
            option.getId(),
          ),
        );
      }
    }

    await this.databaseRowRepository.save(row, context);

    return DatabaseRowDto.fromDomain(row);
  }
}
