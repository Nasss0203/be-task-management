import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { type FindNotificationRepository } from 'src/modules/notifications/interfaces/repositories/find-notification.repository.interface';
import {
  type CreateNotificationService,
  type CreateNotificationServiceInput,
} from 'src/modules/notifications/interfaces/services/create.notifications.service.interface';
import {
  TaskDueSoonLookup,
  type FindTaskRepository,
} from '../interfaces/repositories/find-task.repository.interface';
import { TaskDeadlineCron } from './task-deadline.cron';

describe('TaskDeadlineCron', () => {
  let findTaskRepository: jest.Mocked<
    Pick<FindTaskRepository, 'findTasksDueSoon'>
  >;
  let findNotificationRepository: jest.Mocked<
    Pick<FindNotificationRepository, 'existsByReceiverTypeAndTask'>
  >;
  let createNotificationService: jest.Mocked<
    Pick<CreateNotificationService, 'createNotification'>
  >;
  let cron: TaskDeadlineCron;

  const task: TaskDueSoonLookup = {
    id: 'task-1',
    workspaceId: 'workspace-1',
    workspaceName: 'Workspace',
    workspaceSlug: 'acme',
    projectId: 'project-1',
    projectName: 'Project',
    projectSeq: 7,
    title: 'Ship reminder',
    statusName: 'In Progress',
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    assignees: [
      {
        userId: 'user-1',
        username: 'linh',
      },
      {
        userId: 'user-1',
        username: 'linh',
      },
    ],
  };

  beforeEach(() => {
    findTaskRepository = {
      findTasksDueSoon: jest.fn(),
    };
    findNotificationRepository = {
      existsByReceiverTypeAndTask: jest.fn(),
    };
    createNotificationService = {
      createNotification: jest.fn(),
    };

    cron = new TaskDeadlineCron(
      findTaskRepository as unknown as FindTaskRepository,
      findNotificationRepository as unknown as FindNotificationRepository,
      createNotificationService as CreateNotificationService,
    );
  });

  it('sends one TASK_DUE_SOON notification per assigned user', async () => {
    findTaskRepository.findTasksDueSoon.mockResolvedValue([task]);
    findNotificationRepository.existsByReceiverTypeAndTask.mockResolvedValue(
      false,
    );
    createNotificationService.createNotification.mockResolvedValue({
      id: 'notification-1',
    } as Awaited<ReturnType<CreateNotificationService['createNotification']>>);

    const result = await cron.sendDueSoonNotifications();

    expect(findTaskRepository.findTasksDueSoon).toHaveBeenCalledWith(3);
    expect(
      findNotificationRepository.existsByReceiverTypeAndTask,
    ).toHaveBeenCalledTimes(1);
    expect(createNotificationService.createNotification).toHaveBeenCalledTimes(
      1,
    );

    const [input] = createNotificationService.createNotification.mock
      .calls[0] as [CreateNotificationServiceInput];

    expect(input).toMatchObject({
      receiverId: 'user-1',
      senderType: NotificationSenderType.SYSTEM,
      sourceType: NotificationSourceType.TASK,
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      taskId: 'task-1',
      type: NotificationType.TASK_DUE_SOON,
      actionUrl: '/dashboard/acme/projects/project-1?taskId=task-1',
    });
    expect(input.metadata).toMatchObject({
      workspaceSlug: 'acme',
      projectSeq: 7,
      taskTitle: 'Ship reminder',
    });
    expect(result).toEqual({
      tasksScanned: 1,
      notificationsSent: 1,
    });
  });

  it('skips a task notification when the receiver was already notified', async () => {
    findTaskRepository.findTasksDueSoon.mockResolvedValue([task]);
    findNotificationRepository.existsByReceiverTypeAndTask.mockResolvedValue(
      true,
    );

    const result = await cron.sendDueSoonNotifications();

    expect(createNotificationService.createNotification).not.toHaveBeenCalled();
    expect(result).toEqual({
      tasksScanned: 1,
      notificationsSent: 0,
    });
  });
});
