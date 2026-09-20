import { Controller, Get, Inject, Param, Patch, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { QueryNotificationDto } from '../../../application/dto/request/query-notification.dto';
import { GetNotificationsHandler } from '../../../application/queries/get-notifications/get-notifications.handler';
import { GetNotificationsQuery } from '../../../application/queries/get-notifications/get-notifications.query';
import { GetUnreadCountHandler } from '../../../application/queries/get-unread-count/get-unread-count.handler';
import { GetUnreadCountQuery } from '../../../application/queries/get-unread-count/get-unread-count.query';
import { type UpdateNotificationService } from '../../../application/ports/update-notification.service.port';
import { NOTIFICATION_TYPES } from '../../../notifications.types';

@Controller('notifications')
@ReadRateLimit()
export class NotificationsController {
  constructor(
    private readonly getNotificationsHandler: GetNotificationsHandler,
    private readonly getUnreadCountHandler: GetUnreadCountHandler,

    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly updateNotificationService: UpdateNotificationService,
  ) {}

  @Get()
  @ResponseMessage('Find notifications successfully')
  async findMyNotifications(
    @Auth() auth: IAuth,
    @Query() query: QueryNotificationDto,
  ) {
    return this.getNotificationsHandler.execute(
      new GetNotificationsQuery(auth.id, {
        ...query,
        unreadOnly: query.unreadOnly === 'true',
      }),
    );
  }

  @Get('unread-count')
  @ResponseMessage('Count unread notifications successfully')
  async countUnread(@Auth() auth: IAuth) {
    return this.getUnreadCountHandler.execute(new GetUnreadCountQuery(auth.id));
  }

  @Patch('read-all')
  @WriteRateLimit()
  @ResponseMessage('Mark all notifications as read successfully')
  async markAllAsRead(@Auth() auth: IAuth) {
    const updated = await this.updateNotificationService.markAllAsRead(auth.id);

    return { updated };
  }

  @Patch(':id/read')
  @WriteRateLimit()
  @ResponseMessage('Mark notification as read successfully')
  async markAsRead(@Auth() auth: IAuth, @Param('id') id: string) {
    const updated = await this.updateNotificationService.markAsRead(
      id,
      auth.id,
    );

    return { updated };
  }
}
