import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { NotificationType } from 'src/modules/notifications/domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';
import { TaskAssigneeMapper } from '../mapper/task_assignee.mapper';
import { CreateTaskAssigneeApplicationImpl } from './create.task_assignee.application';

describe('CreateTaskAssigneeApplicationImpl', () => {
  let application: CreateTaskAssigneeApplicationImpl;

  const mockCreateTaskAssigneeService = { assign: jest.fn() };
  const mockFindMemberService = { findMemberInWorkspace: jest.fn() };
  const mockFindTaskService = { findOneTask: jest.fn() };
  const mockCreateNotificationService = { createNotification: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskAssigneeApplicationImpl,
        {
          provide: TASK_ASSIGNEE_TYPES.services.CreateTaskAssigneeService,
          useValue: mockCreateTaskAssigneeService,
        },
        {
          provide: USER_WORKSPACE_TYPES.services.FindMemberService,
          useValue: mockFindMemberService,
        },
        {
          provide: TASK_TYPES.services.FindTaskService,
          useValue: mockFindTaskService,
        },
        {
          provide: NOTIFICATION_TYPES.services.CreateNotificationService,
          useValue: mockCreateNotificationService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    application = module.get<CreateTaskAssigneeApplicationImpl>(
      CreateTaskAssigneeApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('assign', () => {
    const input = { taskId: 'task-1', userId: 'user-2', assignedBy: 'user-1' };
    const task = {
      id: 'task-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      title: 'Task 1',
    };
    const actorMember = { role_name: RoleName.ADMIN };
    const targetMember = { role_name: RoleName.MEMBER };

    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(application.assign(input)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if actor is not a member of workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(null);
      await expect(application.assign(input)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if target user is not a member of workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        actorMember,
      );
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(null);
      await expect(application.assign(input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user tries to assign other without permission', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce({
        role_name: RoleName.MEMBER,
      });
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        targetMember,
      );
      await expect(application.assign(input)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should assign successfully and send notification when assigning other user', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        actorMember,
      );
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        targetMember,
      );
      mockCreateTaskAssigneeService.assign.mockResolvedValue({
        id: 'assignee-1',
        user: { id: 'user-2' },
      });
      mockCreateNotificationService.createNotification.mockResolvedValue({
        id: 'noti-1',
      });

      const originalMapper = TaskAssigneeMapper.toResponse;
      TaskAssigneeMapper.toResponse = jest
        .fn()
        .mockReturnValue({ isMapped: true });

      const result = await application.assign(input);

      expect(mockCreateTaskAssigneeService.assign).toHaveBeenCalledWith(
        input,
        undefined,
      );
      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ActivityAction.TASK_ASSIGNED,
          field: 'assignee',
          newValue: 'user-2',
        }),
        undefined,
      );
      expect(
        mockCreateNotificationService.createNotification,
      ).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.NOTIFICATION_CREATED,
        expect.any(Object),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.TASK_UPDATED,
        expect.any(Object),
      );
      expect(result).toEqual({ isMapped: true });

      TaskAssigneeMapper.toResponse = originalMapper;
    });

    it('should assign successfully without notification if self assign', async () => {
      const selfInput = {
        taskId: 'task-1',
        userId: 'user-1',
        assignedBy: 'user-1',
      };
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue({
        role_name: RoleName.MEMBER,
      });
      mockCreateTaskAssigneeService.assign.mockResolvedValue({
        id: 'assignee-1',
        user: { id: 'user-1' },
      });

      const originalMapper = TaskAssigneeMapper.toResponse;
      TaskAssigneeMapper.toResponse = jest
        .fn()
        .mockReturnValue({ isMapped: true });

      await application.assign(selfInput);

      expect(
        mockCreateNotificationService.createNotification,
      ).not.toHaveBeenCalled();

      TaskAssigneeMapper.toResponse = originalMapper;
    });
  });
});
