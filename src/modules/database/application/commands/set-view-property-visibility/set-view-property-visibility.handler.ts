import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';

import { DatabaseViewPropertyNotFoundException } from '../../../domain/exceptions/database-view-property-not-found.exception';

import { type DatabaseViewRepository } from '../../../domain/repositories/database-view.repository';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DatabaseViewDetailDto } from '../../dto/database-view-detail.dto';

import { SetViewPropertyVisibilityCommand } from './set-view-property-visibility.command';

@Injectable()
export class SetViewPropertyVisibilityHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  async execute(
    command: SetViewPropertyVisibilityCommand,
  ): Promise<DatabaseViewDetailDto> {
    const view = await this.databaseViewRepository.findById(command.viewId);

    if (!view) {
      throw new NotFoundException('Database view not found');
    }

    if (view.getDatabaseId() !== command.databaseId) {
      throw new BadRequestException(
        'Database view does not belong to this database',
      );
    }

    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const property = database
      .getProperties()
      .find((item) => item.getId() === command.propertyId);

    if (!property) {
      throw new NotFoundException('Database property not found');
    }

    // Chỉ chặn thao tác HIDE.
    // Vẫn cho phép visible=true để khôi phục dữ liệu cũ.
    if (!command.visible && !property.getIsHideable()) {
      throw new BadRequestException('This property cannot be hidden');
    }

    try {
      view.setPropertyVisibility(command.propertyId, command.visible);
    } catch (error) {
      if (error instanceof DatabaseViewPropertyNotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    await this.databaseViewRepository.save(view);

    return DatabaseViewDetailDto.fromDomain(view);
  }
}
