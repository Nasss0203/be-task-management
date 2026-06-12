import { Test, TestingModule } from '@nestjs/testing';
import { MoveTaskSprintApplicationImpl } from './move-task-sprint.application';
import { TASK_TYPES } from '../interfaces/types';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from 'src/modules/sprints/domain/entities/sprint.entity';

describe('MoveTaskSprintApplicationImpl', () => {
  let app: MoveTaskSprintApplicationImpl;

  const mockFindTaskService = { findOneTask: jest.fn() };
  const mockFindSprintService = { findOneSprint: jest.fn() };
  const mockFindMemberService = { findMemberInWorkspace: jest.fn() };
  const mockMoveTaskSprintService = { move: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveTaskSprintApplicationImpl,
        { provide: TASK_TYPES.services.FindTaskService, useValue: mockFindTaskService },
        { provide: SPRINT_TYPES.services.FindSprintService, useValue: mockFindSprintService },
        { provide: USER_WORKSPACE_TYPES.services.FindMemberService, useValue: mockFindMemberService },
        { provide: TASK_TYPES.services.MoveTaskSprintService, useValue: mockMoveTaskSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<MoveTaskSprintApplicationImpl>(MoveTaskSprintApplicationImpl);
  });

  it('should throw NotFoundException if task not found', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue(null);
    await expect(app.move({ taskId: '1', sprintId: 'sprint-1', userId: 'user-1' })).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user not member of workspace', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue({ workspaceId: 'ws-1' });
    mockFindMemberService.findMemberInWorkspace.mockResolvedValue(null);
    await expect(app.move({ taskId: '1', sprintId: 'sprint-1', userId: 'user-1' })).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if sprint is provided but not found', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue({ workspaceId: 'ws-1' });
    mockFindMemberService.findMemberInWorkspace.mockResolvedValue({});
    mockFindSprintService.findOneSprint.mockResolvedValue(null);
    await expect(app.move({ taskId: '1', sprintId: 'sprint-1', userId: 'user-1' })).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if sprint workspace does not match', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue({ workspaceId: 'ws-1' });
    mockFindMemberService.findMemberInWorkspace.mockResolvedValue({});
    mockFindSprintService.findOneSprint.mockResolvedValue({ workspaceId: 'ws-2' });
    await expect(app.move({ taskId: '1', sprintId: 'sprint-1', userId: 'user-1' })).rejects.toThrow(BadRequestException);
  });

  it('should move task and create activity', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', sprintId: null });
    mockFindMemberService.findMemberInWorkspace.mockResolvedValue({});
    mockFindSprintService.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE });
    mockMoveTaskSprintService.move.mockResolvedValue({ id: '1', workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-1', assignees: [] });

    await app.move({ taskId: '1', sprintId: 'sprint-1', userId: 'user-1' });

    expect(mockMoveTaskSprintService.move).toHaveBeenCalledWith({ sprintId: 'sprint-1', taskId: '1' });
    expect(mockCreateActivityService.create).toHaveBeenCalled();
  });
});
