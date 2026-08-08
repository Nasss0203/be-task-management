import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';
import { DeleteTaskAssigneeApplicationImpl } from './delete.task_assignee.application';

describe('DeleteTaskAssigneeApplicationImpl', () => {
  let application: DeleteTaskAssigneeApplicationImpl;

  const mockDeleteTaskAssigneeService = { unassign: jest.fn() };
  const mockFindTaskAssigneeService = { findOneTaskAssignee: jest.fn() };
  const mockFindMemberService = { findMemberInWorkspace: jest.fn() };
  const mockFindTaskService = { findOneTask: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTaskAssigneeApplicationImpl,
        {
          provide: TASK_ASSIGNEE_TYPES.services.DeleteTaskAssigneeService,
          useValue: mockDeleteTaskAssigneeService,
        },
        {
          provide: TASK_ASSIGNEE_TYPES.services.FindTaskAssigneeService,
          useValue: mockFindTaskAssigneeService,
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
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
      ],
    }).compile();

    application = module.get<DeleteTaskAssigneeApplicationImpl>(
      DeleteTaskAssigneeApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('unassign', () => {
    const input = { taskId: 'task-1', userId: 'user-2', deletedBy: 'user-1' };
    const task = { id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1' };
    const actorMember = { role_name: RoleName.ADMIN };
    const targetMember = { role_name: RoleName.MEMBER };
    const taskAssignee = { id: 'assignee-1' };

    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(application.unassign(input)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if actor is not a member of workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(null);
      await expect(application.unassign(input)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if target user is not a member of workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        actorMember,
      );
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(null);
      await expect(application.unassign(input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user is not assigned to task', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        actorMember,
      );
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        targetMember,
      );
      mockFindTaskAssigneeService.findOneTaskAssignee.mockResolvedValue(null);
      await expect(application.unassign(input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow member to unassign other user', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce({
        role_name: RoleName.MEMBER,
      });
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        targetMember,
      );
      mockFindTaskAssigneeService.findOneTaskAssignee.mockResolvedValue(
        taskAssignee,
      );

      const result = await application.unassign(input);

      expect(mockDeleteTaskAssigneeService.unassign).toHaveBeenCalledWith(
        input,
      );
      expect(result).toEqual({
        taskId: 'task-1',
        userId: 'user-2',
        unassigned: true,
      });
    });

    it('should unassign successfully', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(task);
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        actorMember,
      );
      mockFindMemberService.findMemberInWorkspace.mockResolvedValueOnce(
        targetMember,
      );
      mockFindTaskAssigneeService.findOneTaskAssignee.mockResolvedValue(
        taskAssignee,
      );

      const result = await application.unassign(input);

      expect(mockDeleteTaskAssigneeService.unassign).toHaveBeenCalledWith(
        input,
      );
      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ActivityAction.TASK_UNASSIGNED,
          field: 'assignee',
          oldValue: 'user-2',
        }),
      );
      expect(result).toEqual({
        taskId: 'task-1',
        userId: 'user-2',
        unassigned: true,
      });
    });
  });
});
