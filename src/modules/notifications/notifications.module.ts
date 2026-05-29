import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateNotificationApplicationImpl } from './applications/create.notifications.application';
import { FindNotificationApplicationImpl } from './applications/find-notification.application';
import { NotificationsController } from './controller/notifications.controller';
import { Notification } from './domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from './interfaces/types';
import { CreateNotificationRepositoryImpl } from './repositories/create.notifications.repository';
import { FindNotificationRepositoryImpl } from './repositories/find-notification.repository';
import { UpdateNotificationRepositoryImpl } from './repositories/update-notification.repository';
import { CreateNotificationServiceImpl } from './services/create.notifications.service';
import { FindNotificationServiceImpl } from './services/find-notification.service';
import { UpdateNotificationServiceImpl } from './services/update-notification.service';

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
    NOTIFICATION_TYPES.services.CreateNotificationService,
    NOTIFICATION_TYPES.services.UpdateNotificationService,
  ],
})
export class NotificationsModule {}
