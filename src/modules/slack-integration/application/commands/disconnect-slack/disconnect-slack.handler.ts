import { Inject, Injectable } from '@nestjs/common';

import type { SlackConnectionRepository } from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import { DisconnectSlackCommand } from './disconnect-slack.command';

@Injectable()
export class DisconnectSlackHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,
  ) {}

  async execute(command: DisconnectSlackCommand): Promise<void> {
    await this.connectionRepository.deleteByUserId(command.userId);
  }
}
