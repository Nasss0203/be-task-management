import { Test, TestingModule } from '@nestjs/testing';
import { MoveTaskSprintToSprintApplicationImpl } from './move-task-sprint-to-sprint.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';

describe('MoveTaskSprintToSprintApplicationImpl', () => {
  let app: MoveTaskSprintToSprintApplicationImpl;

  const mockMoveTaskSprintToSprintService = { move: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveTaskSprintToSprintApplicationImpl,
        { provide: TASK_TYPES.services.MoveTaskSprintToSprintService, useValue: mockMoveTaskSprintToSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
      ],
    }).compile();

    app = module.get<MoveTaskSprintToSprintApplicationImpl>(MoveTaskSprintToSprintApplicationImpl);
  });

  it('should move task and create activity', async () => {
    mockMoveTaskSprintToSprintService.move.mockResolvedValue({ id: '1', workspaceId: 'ws-1', projectId: 'proj-1', assignees: [] });
    await app.move({ workspaceId: 'ws-1', projectId: 'proj-1', taskId: '1', sourceSprintId: 's-1', targetSprintId: 's-2', userId: 'user-1' });

    expect(mockMoveTaskSprintToSprintService.move).toHaveBeenCalled();
    expect(mockCreateActivityService.create).toHaveBeenCalled();
  });
});
