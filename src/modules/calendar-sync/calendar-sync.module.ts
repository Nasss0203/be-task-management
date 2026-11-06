import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule as BusinessDatabaseModule } from 'src/modules/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';
import { GoogleCalendarStateTokenService } from 'src/shared/security/google-calendar-state-token.service';
import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import { ConnectGoogleCalendarHandler } from './application/commands/connect-google-calendar/connect-google-calendar.handler';
import { DeleteGoogleCalendarSyncHandler } from './application/commands/delete-google-calendar-sync/delete-google-calendar-sync.handler';
import { DisconnectGoogleCalendarHandler } from './application/commands/disconnect-google-calendar/disconnect-google-calendar.handler';
import { RequestGoogleCalendarSyncHandler } from './application/commands/request-google-calendar-sync/request-google-calendar-sync.handler';
import { RunGoogleCalendarSyncHandler } from './application/commands/run-google-calendar-sync/run-google-calendar-sync.handler';
import { UpsertGoogleCalendarSyncHandler } from './application/commands/upsert-google-calendar-sync/upsert-google-calendar-sync.handler';
import { GetGoogleCalendarAuthorizeUrlHandler } from './application/queries/get-google-calendar-authorize-url/get-google-calendar-authorize-url.handler';
import { GetGoogleCalendarSyncHandler } from './application/queries/get-google-calendar-sync/get-google-calendar-sync.handler';
import { GoogleCalendarAccessTokenService } from './application/services/google-calendar-access-token.service';
import { CALENDAR_SYNC_TYPES } from './calendar-sync.types';
import { FetchGoogleCalendarClient } from './infrastructure/google/fetch-google-calendar-client';
import { GoogleCalendarConnectionOrmEntity } from './infrastructure/persistence/typeorm/entities/google-calendar-connection.orm-entity';
import { GoogleCalendarSyncOrmEntity } from './infrastructure/persistence/typeorm/entities/google-calendar-sync.orm-entity';
import { TypeOrmGoogleCalendarConnectionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-google-calendar-connection.repository';
import { TypeOrmGoogleCalendarSyncRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-google-calendar-sync.repository';
import { BullMqGoogleCalendarSyncJobQueue } from './infrastructure/queue/bullmq-google-calendar-sync-job-queue.service';
import { GOOGLE_CALENDAR_SYNC_QUEUE } from './infrastructure/queue/google-calendar-sync-queue.constants';
import { GoogleCalendarSyncProcessor } from './infrastructure/queue/google-calendar-sync.processor';
import { GoogleCalendarController } from './presentation/http/controllers/google-calendar.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoogleCalendarConnectionOrmEntity,
      GoogleCalendarSyncOrmEntity,
    ]),
    BullModule.registerQueue({ name: GOOGLE_CALENDAR_SYNC_QUEUE }),
    BusinessDatabaseModule,
    PermissionModule,
  ],
  controllers: [GoogleCalendarController],
  providers: [
    {
      provide:
        CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository,
      useClass: TypeOrmGoogleCalendarConnectionRepository,
    },
    {
      provide: CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository,
      useClass: TypeOrmGoogleCalendarSyncRepository,
    },
    {
      provide: CALENDAR_SYNC_TYPES.ports.GoogleCalendarClient,
      useClass: FetchGoogleCalendarClient,
    },
    {
      provide: CALENDAR_SYNC_TYPES.ports.GoogleCalendarSyncJobQueue,
      useClass: BullMqGoogleCalendarSyncJobQueue,
    },
    {
      provide: CALENDAR_SYNC_TYPES.services.GoogleCalendarAccessTokenService,
      useClass: GoogleCalendarAccessTokenService,
    },
    {
      provide:
        CALENDAR_SYNC_TYPES.applications.GetGoogleCalendarAuthorizeUrlHandler,
      useClass: GetGoogleCalendarAuthorizeUrlHandler,
    },
    {
      provide: CALENDAR_SYNC_TYPES.applications.GetGoogleCalendarSyncHandler,
      useClass: GetGoogleCalendarSyncHandler,
    },
    {
      provide: CALENDAR_SYNC_TYPES.applications.ConnectGoogleCalendarHandler,
      useClass: ConnectGoogleCalendarHandler,
    },
    {
      provide: CALENDAR_SYNC_TYPES.applications.DisconnectGoogleCalendarHandler,
      useClass: DisconnectGoogleCalendarHandler,
    },
    {
      provide: CALENDAR_SYNC_TYPES.applications.UpsertGoogleCalendarSyncHandler,
      useClass: UpsertGoogleCalendarSyncHandler,
    },
    {
      provide: CALENDAR_SYNC_TYPES.applications.DeleteGoogleCalendarSyncHandler,
      useClass: DeleteGoogleCalendarSyncHandler,
    },
    {
      provide:
        CALENDAR_SYNC_TYPES.applications.RequestGoogleCalendarSyncHandler,
      useClass: RequestGoogleCalendarSyncHandler,
    },
    {
      provide: CALENDAR_SYNC_TYPES.applications.RunGoogleCalendarSyncHandler,
      useClass: RunGoogleCalendarSyncHandler,
    },
    TokenCipherService,
    GoogleCalendarStateTokenService,
    GoogleCalendarSyncProcessor,
  ],
})
export class CalendarSyncModule {}
