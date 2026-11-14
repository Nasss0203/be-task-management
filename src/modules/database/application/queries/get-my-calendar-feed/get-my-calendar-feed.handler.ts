import { Inject, Injectable } from '@nestjs/common';

import { CalendarFeedTokenService } from 'src/shared/security/calendar-feed-token.service';

import { DATABASE_TYPES } from '../../../database.types';
import type { CalendarFeedRepository } from '../../../domain/repositories/calendar-feed.repository';
import { GetMyCalendarFeedQuery } from './get-my-calendar-feed.query';

export interface CalendarFeedResult {
  token: string;
  datePropertyId: string;
}

@Injectable()
export class GetMyCalendarFeedHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.CalendarFeedRepository)
    private readonly calendarFeedRepository: CalendarFeedRepository,

    private readonly calendarFeedTokenService: CalendarFeedTokenService,
  ) {}

  async execute(
    query: GetMyCalendarFeedQuery,
  ): Promise<CalendarFeedResult | null> {
    const feed = await this.calendarFeedRepository.findActive(
      query.databaseId,
      query.userId,
    );

    if (!feed) {
      return null;
    }

    return {
      token: this.calendarFeedTokenService.generate(feed.id),
      datePropertyId: feed.datePropertyId,
    };
  }
}
