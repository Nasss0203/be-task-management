import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import { CannotDeleteDefaultPropertyException } from '../../../domain/exceptions/cannot-delete-default-property.exception';
import { DatabasePropertyNotFoundException } from '../../../domain/exceptions/database-property-not-found.exception';
import { type DatabaseRepository } from '../../../domain/repositories/database.repository';

import { DeletePropertyCommand } from './delete-property.command';
import type { DatabaseActivityRecorder } from '../../ports/database-activity-recorder.port';
import type { DatabaseRowChangePublisher } from '../../ports/database-row-change-publisher.port';

@Injectable()
export class DeletePropertyHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
    @Inject(DATABASE_TYPES.ports.DatabaseActivityRecorder)
    private readonly activityRecorder: DatabaseActivityRecorder,
    @Inject(DATABASE_TYPES.ports.DatabaseRowChangePublisher)
    private readonly rowChangePublisher: DatabaseRowChangePublisher,
  ) {}

  async execute(command: DeletePropertyCommand): Promise<void> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    try {
      database.removeProperty(command.propertyId);

      await this.databaseRepository.deleteProperty(command.propertyId);
      await this.activityRecorder.record({
        actorId: command.actorId,
        databaseId: database.getId(),
        action: 'DATABASE_PROPERTY_DELETED',
        propertyId: command.propertyId,
      });
      this.rowChangePublisher.publish(database.getId());
    } catch (error) {
      if (error instanceof DatabasePropertyNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      if (error instanceof CannotDeleteDefaultPropertyException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
