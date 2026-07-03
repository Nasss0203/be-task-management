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
import {
  TaskDueSoonLookup,
  type FindTaskRepository,
} from '../interfaces/repositories/find-task.repository.interface';
import { TASK_TYPES } from '../interfaces/types';

const DUE_SOON_WINDOW_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CRON_TIME_ZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class TaskDeadlineCron {
  private readonly logger = new Logger(TaskDeadlineCron.name);

  constructor(
    @Inject(TASK_TYPES.repositories.FindTaskRepository)
    private readonly findTaskRepository: FindTaskRepository,

    @Inject(NOTIFICATION_TYPES.repositories.FindNotificationRepository)
    private readonly findNotificationRepository: FindNotificationRepository,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,
  ) {}

  @Cron('0 8 * * *', {
    name: 'task-deadline-reminder',
    timeZone: CRON_TIME_ZONE,
  })
  async handleDailyTaskDeadlineReminder(): Promise<void> {
    await this.sendDueSoonNotifications();
  }

  async sendDueSoonNotifications(
    days = DUE_SOON_WINDOW_DAYS,
  ): Promise<{ tasksScanned: number; notificationsSent: number }> {
    const tasks = await this.findTaskRepository.findTasksDueSoon(days);
    let notificationsSent = 0;

    for (const task of tasks) {
      const receiverIds = this.getUniqueReceiverIds(task);

      for (const receiverId of receiverIds) {
        const alreadyNotified =
          await this.findNotificationRepository.existsByReceiverTypeAndTask({
            receiverId,
            type: NotificationType.TASK_DUE_SOON,
            taskId: task.id,
          });

        if (alreadyNotified) {
          continue;
        }

        const daysRemaining = this.getDaysUntilDue(task.dueAt);

        await this.createNotificationService.createNotification({
          receiverId,
          senderType: NotificationSenderType.SYSTEM,
          sourceType: NotificationSourceType.TASK,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
          type: NotificationType.TASK_DUE_SOON,
          title: 'Task sắp tới hạn',
          message: this.buildMessage(task, daysRemaining),
          actionUrl: this.buildActionUrl(task),
          metadata: {
            workspaceName: task.workspaceName,
            workspaceSlug: task.workspaceSlug,
            projectName: task.projectName,
            taskTitle: task.title,
            projectSeq: task.projectSeq,
            dueAt: task.dueAt.toISOString(),
            daysRemaining,
          },
        });

        notificationsSent += 1;
      }
    }

    this.logger.log(
      `Task deadline scan completed: ${tasks.length} task(s), ${notificationsSent} notification(s) sent.`,
    );

    return {
      tasksScanned: tasks.length,
      notificationsSent,
    };
  }

  private getUniqueReceiverIds(task: TaskDueSoonLookup): string[] {
    return Array.from(
      new Set(
        task.assignees
          .map((assignee) => assignee.userId)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    );
  }

  private getDaysUntilDue(dueAt: Date, now = new Date()): number {
    return Math.max(
      1,
      Math.ceil((dueAt.getTime() - now.getTime()) / MS_PER_DAY),
    );
  }

  private buildMessage(task: TaskDueSoonLookup, daysRemaining: number): string {
    const taskName = task.title?.trim() || this.buildTaskFallbackName(task);
    const dueDate = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeZone: CRON_TIME_ZONE,
    }).format(task.dueAt);

    return `${taskName} sẽ tới hạn trong ${daysRemaining} ngày (${dueDate}).`;
  }

  private buildTaskFallbackName(task: TaskDueSoonLookup): string {
    if (task.projectSeq !== null) {
      return `Task #${task.projectSeq}`;
    }

    return `Task ${task.id}`;
  }

  private buildActionUrl(task: TaskDueSoonLookup): string {
    const searchParams = new URLSearchParams({
      taskId: task.id,
    });

    return `/dashboard/${encodeURIComponent(task.workspaceSlug)}/projects/${task.projectId}?${searchParams.toString()}`;
  }
}
