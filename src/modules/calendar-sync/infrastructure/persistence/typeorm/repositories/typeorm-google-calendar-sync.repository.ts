import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GoogleCalendarSyncError } from '../../../../domain/google-calendar-sync-error';
import type {
  GoogleCalendarSync,
  GoogleCalendarSyncRepository,
} from '../../../../domain/repositories/google-calendar-sync.repository';
import { GoogleCalendarSyncOrmEntity } from '../entities/google-calendar-sync.orm-entity';

const toSync = (orm: GoogleCalendarSyncOrmEntity): GoogleCalendarSync => ({
  id: orm.id,
  connectionId: orm.connectionId,
  databaseId: orm.databaseId,
  datePropertyId: orm.datePropertyId,
  assignedToMeOnly: orm.assignedToMeOnly,
  googleCalendarId: orm.googleCalendarId,
  lastSyncedAt: orm.lastSyncedAt,
  lastError: orm.lastError as GoogleCalendarSyncError | null,
});

@Injectable()
export class TypeOrmGoogleCalendarSyncRepository implements GoogleCalendarSyncRepository {
  constructor(
    @InjectRepository(GoogleCalendarSyncOrmEntity)
    private readonly repository: Repository<GoogleCalendarSyncOrmEntity>,
  ) {}

  async findById(id: string) {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? toSync(orm) : null;
  }

  async findByConnectionAndDatabase(connectionId: string, databaseId: string) {
    const orm = await this.repository.findOne({
      where: { connectionId, databaseId },
    });
    return orm ? toSync(orm) : null;
  }

  async findIdsToSync() {
    const rows = await this.repository
      .createQueryBuilder('sync')
      .innerJoin('sync.connection', 'connection')
      .select('sync.id', 'id')
      .where('connection.last_error IS DISTINCT FROM :revoked', {
        revoked: GoogleCalendarSyncError.ACCESS_REVOKED,
      })
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }

  async save(sync: GoogleCalendarSync) {
    await this.repository.save(this.repository.create(sync));
  }

  async markSynced(id: string, syncedAt: Date) {
    await this.repository.update(
      { id },
      { lastSyncedAt: syncedAt, lastError: null },
    );
  }

  async markFailed(id: string, error: GoogleCalendarSyncError) {
    await this.repository.update({ id }, { lastError: error });
  }

  async delete(id: string) {
    await this.repository.delete({ id });
  }
}
