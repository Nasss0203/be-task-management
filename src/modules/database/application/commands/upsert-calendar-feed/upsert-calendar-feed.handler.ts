import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CalendarFeedTokenService } from 'src/shared/security/calendar-feed-token.service';

import { DATABASE_TYPES } from '../../../database.types';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import type { CalendarFeedRepository } from '../../../domain/repositories/calendar-feed.repository';
import type { DatabaseRepository } from '../../../domain/repositories/database.repository';
import type { CalendarFeedResult } from '../../queries/get-my-calendar-feed/get-my-calendar-feed.handler';
import { UpsertCalendarFeedCommand } from './upsert-calendar-feed.command';

@Injectable()
export class UpsertCalendarFeedHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.CalendarFeedRepository)
    private readonly calendarFeedRepository: CalendarFeedRepository,

    private readonly calendarFeedTokenService: CalendarFeedTokenService,
  ) {}

  async execute(
    command: UpsertCalendarFeedCommand,
  ): Promise<CalendarFeedResult> {
    const database = await this.databaseRepository.findById(command.databaseId);

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const property = database
      .getProperties()
      .find((item) => item.getId() === command.datePropertyId);

    if (property?.getType() !== PropertyType.DATE) {
      throw new BadRequestException('Calendar feed needs a Date property');
    }

    const existing = await this.calendarFeedRepository.findActive(
      command.databaseId,
      command.userId,
    );

    const feed = existing
      ? { ...existing, datePropertyId: command.datePropertyId }
      : {
          id: randomUUID(),
          databaseId: command.databaseId,
          datePropertyId: command.datePropertyId,
          createdBy: command.userId,
        };

    await this.calendarFeedRepository.save(feed);

    return {
      token: this.calendarFeedTokenService.generate(feed.id),
      datePropertyId: feed.datePropertyId,
    };
  }
}
