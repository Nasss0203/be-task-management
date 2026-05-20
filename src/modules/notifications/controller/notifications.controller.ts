import { Controller, Get, Inject, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { QueryNotificationDto } from '../dto/query-notification.dto';
import { type FindNotificationApplication } from '../interfaces/applications/find-notification.application.interface';
import { NOTIFICATION_TYPES } from '../interfaces/types';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_TYPES.applications.FindNotificationApplication)
    private readonly findNotificationApplication: FindNotificationApplication,
  ) {}

  @Get()
  @ResponseMessage('Find notifications successfully')
  async findMyNotifications(
    @Auth() auth: IAuth,
    @Query() query: QueryNotificationDto,
  ) {
    return this.findNotificationApplication.findMyNotifications({
      userId: auth.id,

      unreadOnly: query.unreadOnly === 'true',

      sourceType: query.sourceType,
      type: query.type,

      workspaceId: query.workspaceId,
      projectId: query.projectId,
      taskId: query.taskId,

      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Get('unread-count')
  @ResponseMessage('Count unread notifications successfully')
  async countUnread(@Auth() auth: IAuth) {
    return this.findNotificationApplication.countUnread(auth.id);
  }
}
