import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SlackStateTokenService } from 'src/shared/security/slack-state-token.service';
import { TokenCipherService } from 'src/shared/security/token-cipher.service';
import { ContentModule } from 'src/modules/content/content.module';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';

import { ConnectSlackHandler } from './application/commands/connect-slack/connect-slack.handler';
import { DeliverSlackNotificationHandler } from './application/commands/deliver-slack-notification/deliver-slack-notification.handler';
import { DisconnectSlackHandler } from './application/commands/disconnect-slack/disconnect-slack.handler';
import { SlackNotificationListener } from './application/listeners/slack-notification.listener';
import { GetSlackAuthorizeUrlHandler } from './application/queries/get-slack-authorize-url/get-slack-authorize-url.handler';
import { GetSlackStatusHandler } from './application/queries/get-slack-status/get-slack-status.handler';
import { SlackConnectionOrmEntity } from './infrastructure/persistence/typeorm/entities/slack-connection.orm-entity';
import { TypeOrmSlackConnectionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-slack-connection.repository';
import { BullMqSlackDeliveryQueue } from './infrastructure/queue/bullmq-slack-delivery-queue.service';
import { SLACK_DELIVERY_QUEUE } from './infrastructure/queue/slack-delivery-queue.constants';
import { SlackDeliveryProcessor } from './infrastructure/queue/slack-delivery.processor';
import { FetchSlackClient } from './infrastructure/slack/fetch-slack-client';
import { SlackController } from './presentation/http/controllers/slack.controller';
import { SLACK_INTEGRATION_TYPES } from './slack-integration.types';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlackConnectionOrmEntity]),
    BullModule.registerQueue({ name: SLACK_DELIVERY_QUEUE }),
    WorkspaceModule,
    ContentModule,
  ],
  controllers: [SlackController],
  providers: [
    {
      provide: SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository,
      useClass: TypeOrmSlackConnectionRepository,
    },
    {
      provide: SLACK_INTEGRATION_TYPES.ports.SlackClient,
      useClass: FetchSlackClient,
    },
    {
      provide: SLACK_INTEGRATION_TYPES.ports.SlackDeliveryQueue,
      useClass: BullMqSlackDeliveryQueue,
    },
    {
      provide: SLACK_INTEGRATION_TYPES.applications.GetSlackAuthorizeUrlHandler,
      useClass: GetSlackAuthorizeUrlHandler,
    },
    {
      provide: SLACK_INTEGRATION_TYPES.applications.GetSlackStatusHandler,
      useClass: GetSlackStatusHandler,
    },
    {
      provide: SLACK_INTEGRATION_TYPES.applications.ConnectSlackHandler,
      useClass: ConnectSlackHandler,
    },
    {
      provide: SLACK_INTEGRATION_TYPES.applications.DisconnectSlackHandler,
      useClass: DisconnectSlackHandler,
    },
    {
      provide:
        SLACK_INTEGRATION_TYPES.applications.DeliverSlackNotificationHandler,
      useClass: DeliverSlackNotificationHandler,
    },
    TokenCipherService,
    SlackStateTokenService,
    SlackNotificationListener,
    SlackDeliveryProcessor,
  ],
})
export class SlackIntegrationModule {}
