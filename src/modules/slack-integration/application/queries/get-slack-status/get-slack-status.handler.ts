import { Inject, Injectable } from '@nestjs/common';

import type {
  SlackConnectionError,
  SlackConnectionRepository,
  SlackDeliveryError,
} from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import { GetSlackStatusQuery } from './get-slack-status.query';

export type SlackStatus = {
  connected: boolean;
  slackTeamName: string | null;
  connectionError: SlackConnectionError | null;
  lastDeliveredAt: Date | null;
  lastDeliveryFailedAt: Date | null;
  lastDeliveryError: SlackDeliveryError | null;
};

@Injectable()
export class GetSlackStatusHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,
  ) {}

  async execute(query: GetSlackStatusQuery): Promise<SlackStatus> {
    const connection = await this.connectionRepository.findByUserId(
      query.userId,
    );

    return {
      connected: connection !== null,
      slackTeamName: connection?.slackTeamName ?? null,
      connectionError: connection?.lastError ?? null,
      lastDeliveredAt: connection?.lastDeliveredAt ?? null,
      lastDeliveryFailedAt: connection?.lastDeliveryFailedAt ?? null,
      lastDeliveryError: connection?.lastDeliveryError ?? null,
    };
  }
}
