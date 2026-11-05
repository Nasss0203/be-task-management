import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import {
  CalendarFeed,
  CalendarFeedRepository,
} from '../../../../domain/repositories/calendar-feed.repository';
import { CalendarFeedOrmEntity } from '../entities/calendar-feed.orm-entity';

const toFeed = (orm: CalendarFeedOrmEntity): CalendarFeed => ({
  id: orm.id,
  databaseId: orm.databaseId,
  datePropertyId: orm.datePropertyId,
  createdBy: orm.createdBy,
});

@Injectable()
export class TypeOrmCalendarFeedRepository implements CalendarFeedRepository {
  constructor(
    @InjectRepository(CalendarFeedOrmEntity)
    private readonly repository: Repository<CalendarFeedOrmEntity>,
  ) {}

  async findActive(databaseId: string, userId: string) {
    const orm = await this.repository.findOne({
      where: { databaseId, createdBy: userId, revokedAt: IsNull() },
    });
    return orm ? toFeed(orm) : null;
  }

  async findActiveById(id: string) {
    const orm = await this.repository.findOne({
      where: { id, revokedAt: IsNull() },
    });
    return orm ? toFeed(orm) : null;
  }

  async save(feed: CalendarFeed) {
    await this.repository.save(this.repository.create(feed));
  }

  async revoke(databaseId: string, userId: string) {
    await this.repository.update(
      { databaseId, createdBy: userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
