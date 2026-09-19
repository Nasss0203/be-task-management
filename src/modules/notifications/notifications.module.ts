import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateNotificationApplicationImpl } from './application/commands/create-notification/create-notification.handler';
import { FindNotificationApplicationImpl } from './application/queries/get-notifications/get-notifications.handler';
import { NotificationsController } from './presentation/http/controllers/notification.controller';
import { Notification } from './infrastructure/persistence/typeorm/entities/notification.orm-entity';
import { NOTIFICATION_TYPES } from './notifications.types';
import { CreateNotificationRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/typeorm-create-notification.repository';
import { FindNotificationRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/typeorm-find-notification.repository';
import { UpdateNotificationRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/typeorm-update-notification.repository';
import { CreateNotificationServiceImpl } from './application/services/create-notification.service';
import { FindNotificationServiceImpl } from './application/services/find-notification.service';
import { UpdateNotificationServiceImpl } from './application/services/update-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    // Repository
    {
      provide: NOTIFICATION_TYPES.repositories.CreateNotificationRepository,
      useClass: CreateNotificationRepositoryImpl,
    },
    {
      provide: NOTIFICATION_TYPES.repositories.FindNotificationRepository,
      useClass: FindNotificationRepositoryImpl,
    },
    {
      provide: NOTIFICATION_TYPES.repositories.UpdateNotificationRepository,
      useClass: UpdateNotificationRepositoryImpl,
    },
    // Service
    {
      provide: NOTIFICATION_TYPES.services.CreateNotificationService,
      useClass: CreateNotificationServiceImpl,
    },
    {
      provide: NOTIFICATION_TYPES.services.FindNotificationService,
      useClass: FindNotificationServiceImpl,
    },
    {
      provide: NOTIFICATION_TYPES.services.UpdateNotificationService,
      useClass: UpdateNotificationServiceImpl,
    },
    // Application
    {
      provide: NOTIFICATION_TYPES.applications.CreateNotificationApplication,
      useClass: CreateNotificationApplicationImpl,
    },
    {
      provide: NOTIFICATION_TYPES.applications.FindNotificationApplication,
      useClass: FindNotificationApplicationImpl,
    },
  ],
  exports: [
    NOTIFICATION_TYPES.repositories.FindNotificationRepository,
    NOTIFICATION_TYPES.services.CreateNotificationService,
    NOTIFICATION_TYPES.services.UpdateNotificationService,
  ],
})
export class NotificationsModule {}
