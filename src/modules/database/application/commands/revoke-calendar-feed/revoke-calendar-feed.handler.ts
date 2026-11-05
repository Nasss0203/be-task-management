import { Inject, Injectable } from '@nestjs/common';

import { DATABASE_TYPES } from '../../../database.types';
import type { CalendarFeedRepository } from '../../../domain/repositories/calendar-feed.repository';
import { RevokeCalendarFeedCommand } from './revoke-calendar-feed.command';

@Injectable()
export class RevokeCalendarFeedHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.CalendarFeedRepository)
    private readonly calendarFeedRepository: CalendarFeedRepository,
  ) {}

  async execute(command: RevokeCalendarFeedCommand): Promise<void> {
    await this.calendarFeedRepository.revoke(
      command.databaseId,
      command.userId,
    );
  }
}
