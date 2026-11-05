import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { GoogleCalendarSyncError } from '../../../../domain/google-calendar-sync-error';
import type {
  GoogleCalendarConnection,
  GoogleCalendarConnectionRepository,
} from '../../../../domain/repositories/google-calendar-connection.repository';
import { GoogleCalendarConnectionOrmEntity } from '../entities/google-calendar-connection.orm-entity';

const toConnection = (
  orm: GoogleCalendarConnectionOrmEntity,
): GoogleCalendarConnection => ({
  id: orm.id,
  userId: orm.userId,
  googleEmail: orm.googleEmail,
  refreshTokenEncrypted: orm.refreshTokenEncrypted,
  lastError: orm.lastError as GoogleCalendarSyncError | null,
});

@Injectable()
export class TypeOrmGoogleCalendarConnectionRepository implements GoogleCalendarConnectionRepository {
  constructor(
    @InjectRepository(GoogleCalendarConnectionOrmEntity)
    private readonly repository: Repository<GoogleCalendarConnectionOrmEntity>,
  ) {}

  async findById(id: string) {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? toConnection(orm) : null;
  }

  async findByUserId(userId: string) {
    const orm = await this.repository.findOne({ where: { userId } });
    return orm ? toConnection(orm) : null;
  }

  async save(connection: GoogleCalendarConnection) {
    await this.repository.save(this.repository.create(connection));
  }

  async markError(id: string, error: GoogleCalendarSyncError | null) {
    await this.repository.update({ id }, { lastError: error });
  }

  async deleteByUserId(userId: string) {
    await this.repository.delete({ userId });
  }
}
