import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateNotificationApplicationImpl } from './applications/create.notifications.application';
import { FindNotificationApplicationImpl } from './applications/find-notification.application';
import { NotificationsController } from './controller/notifications.controller';
import { Notification } from './domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from './interfaces/types';
import { CreateNotificationRepositoryImpl } from './repositories/create.notifications.repository';
import { FindNotificationRepositoryImpl } from './repositories/find-notification.repository';
import { CreateNotificationServiceImpl } from './services/create.notifications.service';
import { FindNotificationServiceImpl } from './services/find-notification.service';

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
    // Service
    {
      provide: NOTIFICATION_TYPES.services.CreateNotificationService,
      useClass: CreateNotificationServiceImpl,
    },
    {
      provide: NOTIFICATION_TYPES.services.FindNotificationService,
      useClass: FindNotificationServiceImpl,
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
  exports: [NOTIFICATION_TYPES.services.CreateNotificationService],
})
export class NotificationsModule {}
