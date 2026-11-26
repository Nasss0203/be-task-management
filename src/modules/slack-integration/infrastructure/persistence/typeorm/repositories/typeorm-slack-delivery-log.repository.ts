import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type {
  SlackDelivery,
  SlackDeliveryEntry,
  SlackDeliveryFailure,
  SlackDeliveryLog,
  SlackDeliveryStatus,
} from '../../../../domain/repositories/slack-delivery-log.repository';
import { SlackDeliveryOrmEntity } from '../entities/slack-delivery.orm-entity';

type SlackDeliveryRow = {
  id: string;
  notification_type: string;
  title: string;
  status: string;
  error: string | null;
  attempts: number;
  created_at: Date;
  updated_at: Date;
};

const toDelivery = (row: SlackDeliveryRow): SlackDelivery => ({
  id: row.id,
  notificationType: row.notification_type,
  title: row.title,
  status: row.status as SlackDeliveryStatus,
  error: row.error as SlackDeliveryFailure | null,
  attempts: row.attempts,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

@Injectable()
export class TypeOrmSlackDeliveryLogRepository implements SlackDeliveryLog {
  constructor(
    @InjectRepository(SlackDeliveryOrmEntity)
    private readonly repository: Repository<SlackDeliveryOrmEntity>,
  ) {}

  async record(entry: SlackDeliveryEntry): Promise<void> {
    await this.repository.query(
      `INSERT INTO slack_deliveries
         (user_id, notification_id, notification_type, title, status, error, attempts, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       ON CONFLICT (user_id, notification_id) DO UPDATE SET
         status = EXCLUDED.status,
         error = EXCLUDED.error,
         attempts = EXCLUDED.attempts,
         updated_at = EXCLUDED.updated_at`,
      [
        entry.userId,
        entry.notificationId,
        entry.notificationType,
        entry.title,
        entry.status,
        entry.error,
        entry.attempts,
        entry.at,
      ],
    );
  }

  async listByUser(
    userId: string,
    cursor: string | null,
    limit: number,
  ): Promise<SlackDelivery[]> {
    const rows: SlackDeliveryRow[] = await this.repository.query(
      `SELECT delivery.id, delivery.notification_type, delivery.title, delivery.status,
              delivery.error, delivery.attempts, delivery.created_at, delivery.updated_at
         FROM slack_deliveries delivery
        WHERE delivery.user_id = $1
          AND ($2::uuid IS NULL OR (delivery.created_at, delivery.id) < (
                SELECT previous.created_at, previous.id
                  FROM slack_deliveries previous
                 WHERE previous.id = $2::uuid AND previous.user_id = $1))
        ORDER BY delivery.created_at DESC, delivery.id DESC
        LIMIT $3`,
      [userId, cursor, limit],
    );
    return rows.map(toDelivery);
  }

  async deleteOlderThan(userId: string, before: Date): Promise<void> {
    await this.repository.query(
      'DELETE FROM slack_deliveries WHERE user_id = $1 AND created_at < $2',
      [userId, before],
    );
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }
}
