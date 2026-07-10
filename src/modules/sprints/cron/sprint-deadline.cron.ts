import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { type FindNotificationRepository } from 'src/modules/notifications/interfaces/repositories/find-notification.repository.interface';
import { type CreateNotificationService } from 'src/modules/notifications/interfaces/services/create.notifications.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { SPRINT_TYPES } from '../interfaces/types';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';

const SPRINT_DUE_SOON_WINDOW_DAYS = 1;
const CRON_TIME_ZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class SprintDeadlineCron {
  private readonly logger = new Logger(SprintDeadlineCron.name);

  constructor(
    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(NOTIFICATION_TYPES.repositories.FindNotificationRepository)
    private readonly findNotificationRepository: FindNotificationRepository,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,
  ) {}

  @Cron('0 8 * * *', {
    name: 'sprint-deadline-reminder',
    timeZone: CRON_TIME_ZONE,
  })
  async handleDailySprintDeadlineReminder(): Promise<void> {
    await this.sendDueSoonNotifications();
    await this.sendOverdueNotifications();
  }

  async sendDueSoonNotifications(
    days = SPRINT_DUE_SOON_WINDOW_DAYS,
  ): Promise<{ sprintsScanned: number; notificationsSent: number }> {
    const sprints = await this.findSprintRepository.findActiveSprintsDueSoon(days);
    let notificationsSent = 0;

    for (const sprint of sprints) {
      // Find all unique assignees of incomplete tasks in the sprint
      const incompleteTasks = (sprint.tasks ?? []).filter(
        (task) => !task.completedAt && task.status && !task.status.isDone,
      );

      const receiverIds = Array.from(
        new Set(
          incompleteTasks
            .flatMap((task) => (task.assignees ?? []).map((a) => a.userId))
            .filter((userId): userId is string => Boolean(userId)),
        ),
      );

      for (const receiverId of receiverIds) {
        const alreadyNotified =
          await this.findNotificationRepository.existsByReceiverTypeAndSprint({
            receiverId,
            type: NotificationType.SPRINT_DUE_SOON,
            sprintId: sprint.id,
          });

        if (alreadyNotified) {
          continue;
        }

        const formattedDate = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeZone: CRON_TIME_ZONE,
        }).format(sprint.endAt ?? undefined);

        await this.createNotificationService.createNotification({
          receiverId,
          senderType: NotificationSenderType.SYSTEM,
          sourceType: NotificationSourceType.SPRINT,
          workspaceId: sprint.workspaceId,
          projectId: sprint.projectId,
          sprintId: sprint.id,
          type: NotificationType.SPRINT_DUE_SOON,
          title: 'Sprint sắp kết thúc',
          message: `Sprint "${sprint.name}" sẽ kết thúc vào ngày mai (${formattedDate}). Vui lòng cập nhật trạng thái các task của bạn.`,
          actionUrl: this.buildActionUrl(sprint),
          metadata: {
            workspaceName: sprint.workspace?.name,
            workspaceSlug: sprint.workspace?.slug,
            projectName: sprint.project?.name,
            sprintName: sprint.name,
            endAt: sprint.endAt?.toISOString(),
          },
        });

        notificationsSent += 1;
      }
    }

    this.logger.log(
      `Sprint due soon scan completed: ${sprints.length} active sprint(s) scanned, ${notificationsSent} due-soon notification(s) sent.`,
    );

    return {
      sprintsScanned: sprints.length,
      notificationsSent,
    };
  }

  async sendOverdueNotifications(): Promise<{ sprintsScanned: number; notificationsSent: number }> {
    const sprints = await this.findSprintRepository.findActiveSprintsOverdue();
    let notificationsSent = 0;

    for (const sprint of sprints) {
      const receiverId = sprint.createdBy;
      if (!receiverId) continue;

      const alreadyNotified =
        await this.findNotificationRepository.existsByReceiverTypeAndSprint({
          receiverId,
          type: NotificationType.SPRINT_OVERDUE,
          sprintId: sprint.id,
        });

      if (alreadyNotified) {
        continue;
      }

      await this.createNotificationService.createNotification({
        receiverId,
        senderType: NotificationSenderType.SYSTEM,
        sourceType: NotificationSourceType.SPRINT,
        workspaceId: sprint.workspaceId,
        projectId: sprint.projectId,
        sprintId: sprint.id,
        type: NotificationType.SPRINT_OVERDUE,
        title: 'Sprint đã quá hạn',
        message: `Sprint "${sprint.name}" đã quá hạn kết thúc. Vui lòng kiểm tra và hoàn thành (Complete) hoặc dời thời hạn Sprint.`,
        actionUrl: this.buildActionUrl(sprint),
        metadata: {
          workspaceName: sprint.workspace?.name,
          workspaceSlug: sprint.workspace?.slug,
          projectName: sprint.project?.name,
          sprintName: sprint.name,
          endAt: sprint.endAt?.toISOString(),
        },
      });

      notificationsSent += 1;
    }

    this.logger.log(
      `Sprint overdue scan completed: ${sprints.length} active sprint(s) scanned, ${notificationsSent} overdue notification(s) sent.`,
    );

    return {
      sprintsScanned: sprints.length,
      notificationsSent,
    };
  }

  private buildActionUrl(sprint: { workspace: { slug: string }; projectId: string }): string {
    const slug = sprint.workspace?.slug ?? '';
    const projectId = sprint.projectId ?? '';
    return `/dashboard/${encodeURIComponent(slug)}/projects/${projectId}`;
  }
}
