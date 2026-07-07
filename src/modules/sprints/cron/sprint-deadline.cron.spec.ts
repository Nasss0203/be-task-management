import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { type FindNotificationRepository } from 'src/modules/notifications/interfaces/repositories/find-notification.repository.interface';
import {
  type CreateNotificationService,
} from 'src/modules/notifications/interfaces/services/create.notifications.service.interface';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import { SprintDeadlineCron } from './sprint-deadline.cron';

describe('SprintDeadlineCron', () => {
  let findSprintRepository: jest.Mocked<
    Pick<FindSprintRepository, 'findActiveSprintsDueSoon' | 'findActiveSprintsOverdue'>
  >;
  let findNotificationRepository: jest.Mocked<
    Pick<FindNotificationRepository, 'existsByReceiverTypeAndSprint'>
  >;
  let createNotificationService: jest.Mocked<
    Pick<CreateNotificationService, 'createNotification'>
  >;
  let cron: SprintDeadlineCron;

  const mockSprintDueSoon = {
    id: 'sprint-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    name: 'Sprint 1',
    createdBy: 'manager-1',
    endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    workspace: {
      id: 'workspace-1',
      name: 'Workspace',
      slug: 'acme',
    },
    project: {
      id: 'project-1',
      name: 'Project',
    },
    tasks: [
      {
        id: 'task-1',
        completedAt: null,
        status: {
          id: 'status-1',
          name: 'To Do',
          isDone: false,
        },
        assignees: [
          {
            userId: 'user-1',
            username: 'linh',
          },
          {
            userId: 'user-1', // duplicate
            username: 'linh',
          },
        ],
      },
    ],
  } as any;

  const mockSprintOverdue = {
    id: 'sprint-2',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    name: 'Sprint 2',
    createdBy: 'manager-1',
    endAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    workspace: {
      id: 'workspace-1',
      name: 'Workspace',
      slug: 'acme',
    },
    project: {
      id: 'project-1',
      name: 'Project',
    },
    tasks: [],
  } as any;

  beforeEach(() => {
    findSprintRepository = {
      findActiveSprintsDueSoon: jest.fn(),
      findActiveSprintsOverdue: jest.fn(),
    };
    findNotificationRepository = {
      existsByReceiverTypeAndSprint: jest.fn(),
    };
    createNotificationService = {
      createNotification: jest.fn(),
    };

    cron = new SprintDeadlineCron(
      findSprintRepository as unknown as FindSprintRepository,
      findNotificationRepository as unknown as FindNotificationRepository,
      createNotificationService as CreateNotificationService,
    );
  });

  it('sends one SPRINT_DUE_SOON notification per assignee of incomplete tasks', async () => {
    findSprintRepository.findActiveSprintsDueSoon.mockResolvedValue([mockSprintDueSoon]);
    findNotificationRepository.existsByReceiverTypeAndSprint.mockResolvedValue(false);
    createNotificationService.createNotification.mockResolvedValue({ id: 'notification-1' } as any);

    const result = await cron.sendDueSoonNotifications();

    expect(findSprintRepository.findActiveSprintsDueSoon).toHaveBeenCalledWith(1);
    expect(findNotificationRepository.existsByReceiverTypeAndSprint).toHaveBeenCalledTimes(1);
    expect(createNotificationService.createNotification).toHaveBeenCalledTimes(1);

    const [input] = createNotificationService.createNotification.mock.calls[0] as any;
    expect(input).toMatchObject({
      receiverId: 'user-1',
      senderType: NotificationSenderType.SYSTEM,
      sourceType: NotificationSourceType.SPRINT,
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      sprintId: 'sprint-1',
      type: NotificationType.SPRINT_DUE_SOON,
      actionUrl: '/dashboard/acme/projects/project-1',
    });
  });

  it('sends one SPRINT_OVERDUE notification to the creator of overdue sprint', async () => {
    findSprintRepository.findActiveSprintsOverdue.mockResolvedValue([mockSprintOverdue]);
    findNotificationRepository.existsByReceiverTypeAndSprint.mockResolvedValue(false);
    createNotificationService.createNotification.mockResolvedValue({ id: 'notification-2' } as any);

    const result = await cron.sendOverdueNotifications();

    expect(findSprintRepository.findActiveSprintsOverdue).toHaveBeenCalled();
    expect(findNotificationRepository.existsByReceiverTypeAndSprint).toHaveBeenCalledTimes(1);
    expect(createNotificationService.createNotification).toHaveBeenCalledTimes(1);

    const [input] = createNotificationService.createNotification.mock.calls[0] as any;
    expect(input).toMatchObject({
      receiverId: 'manager-1',
      senderType: NotificationSenderType.SYSTEM,
      sourceType: NotificationSourceType.SPRINT,
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      sprintId: 'sprint-2',
      type: NotificationType.SPRINT_OVERDUE,
      actionUrl: '/dashboard/acme/projects/project-1',
    });
  });
});
