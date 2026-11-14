import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type {
  SlackConnection,
  SlackConnectionError,
  SlackConnectionRepository,
  SlackDeliveryError,
} from '../../../../domain/repositories/slack-connection.repository';
import { SlackConnectionOrmEntity } from '../entities/slack-connection.orm-entity';

const toConnection = (orm: SlackConnectionOrmEntity): SlackConnection => ({
  id: orm.id,
  userId: orm.userId,
  slackTeamId: orm.slackTeamId,
  slackTeamName: orm.slackTeamName,
  slackUserId: orm.slackUserId,
  botTokenEncrypted: orm.botTokenEncrypted,
  lastError: orm.lastError as SlackConnectionError | null,
  lastDeliveredAt: orm.lastDeliveredAt,
  lastDeliveryFailedAt: orm.lastDeliveryFailedAt,
  lastDeliveryError: orm.lastDeliveryError as SlackDeliveryError | null,
});

@Injectable()
export class TypeOrmSlackConnectionRepository implements SlackConnectionRepository {
  constructor(
    @InjectRepository(SlackConnectionOrmEntity)
    private readonly repository: Repository<SlackConnectionOrmEntity>,
  ) {}

  async findByUserId(userId: string) {
    const orm = await this.repository.findOne({ where: { userId } });
    return orm ? toConnection(orm) : null;
  }

  async findBySlackUser(slackTeamId: string, slackUserId: string) {
    const orm = await this.repository.findOne({
      where: { slackTeamId, slackUserId },
    });
    return orm ? toConnection(orm) : null;
  }

  async save(connection: SlackConnection) {
    await this.repository.save(this.repository.create(connection));
  }

  async markError(id: string, error: SlackConnectionError | null) {
    await this.repository.update({ id }, { lastError: error });
  }

  async markDelivered(id: string, deliveredAt: Date) {
    await this.repository.update({ id }, { lastDeliveredAt: deliveredAt });
  }

  async markDeliveryFailed(
    id: string,
    failedAt: Date,
    error: SlackDeliveryError,
  ) {
    await this.repository.update(
      { id },
      { lastDeliveryFailedAt: failedAt, lastDeliveryError: error },
    );
  }

  async deleteByUserId(userId: string) {
    await this.repository.delete({ userId });
  }
}
