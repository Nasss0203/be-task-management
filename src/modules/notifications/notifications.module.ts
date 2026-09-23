import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetNotificationsHandler } from './application/queries/get-notifications/get-notifications.handler';
import { GetUnreadCountHandler } from './application/queries/get-unread-count/get-unread-count.handler';
import { CreateNotificationServiceImpl } from './application/services/create-notification.service';
import { UpdateNotificationServiceImpl } from './application/services/update-notification.service';
import { Notification } from './infrastructure/persistence/typeorm/entities/notification.orm-entity';
import { TypeOrmNotificationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-notification.repository';
import { NOTIFICATION_TYPES } from './notifications.types';
import { NotificationsController } from './presentation/http/controllers/notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOTIFICATION_TYPES.repositories.NotificationRepository,
      useClass: TypeOrmNotificationRepository,
    },
    {
      provide: NOTIFICATION_TYPES.services.CreateNotificationService,
      useClass: CreateNotificationServiceImpl,
    },
    {
      provide: NOTIFICATION_TYPES.services.UpdateNotificationService,
      useClass: UpdateNotificationServiceImpl,
    },
    GetNotificationsHandler,
    GetUnreadCountHandler,
  ],
  exports: [
    NOTIFICATION_TYPES.services.CreateNotificationService,
    NOTIFICATION_TYPES.services.UpdateNotificationService,
    NOTIFICATION_TYPES.repositories.NotificationRepository,
  ],
})
export class NotificationsModule {}
