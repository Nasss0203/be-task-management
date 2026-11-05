import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { CalendarFeedTokenService } from 'src/shared/security/calendar-feed-token.service';

import { DATABASE_TYPES } from '../../../database.types';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import type { CalendarFeedRepository } from '../../../domain/repositories/calendar-feed.repository';
import type { DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import type { DatabaseRepository } from '../../../domain/repositories/database.repository';
import { buildCalendarIcs } from '../../services/calendar-ics';
import { GetCalendarFeedIcsQuery } from './get-calendar-feed-ics.query';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GetCalendarFeedIcsHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.CalendarFeedRepository)
    private readonly calendarFeedRepository: CalendarFeedRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,

    private readonly calendarFeedTokenService: CalendarFeedTokenService,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetCalendarFeedIcsQuery): Promise<string> {
    const verified = this.calendarFeedTokenService.verify(query.token);

    const feed =
      verified && UUID_PATTERN.test(verified.linkId)
        ? await this.calendarFeedRepository.findActiveById(verified.linkId)
        : null;

    const database = feed
      ? await this.databaseRepository.findById(feed.databaseId)
      : null;

    if (!feed || !database) {
      throw new NotFoundException('Calendar feed not found');
    }

    const allowed = await this.authorizationService.authorize({
      userId: feed.createdBy,
      permissions: [PERMISSIONS.PAGE_BLOCK_READ],
      target: { type: 'page', id: database.getPageId() },
    });

    if (!allowed) {
      throw new NotFoundException('Calendar feed not found');
    }

    const titleProperty = database
      .getProperties()
      .find((property) => property.getType() === PropertyType.TITLE);

    const rows = await this.databaseRowRepository.findByDatabaseId(
      feed.databaseId,
    );

    return buildCalendarIcs({
      name: database.getName(),
      titlePropertyId: titleProperty?.getId() ?? null,
      datePropertyId: feed.datePropertyId,
      rows,
      now: new Date(),
    });
  }
}
