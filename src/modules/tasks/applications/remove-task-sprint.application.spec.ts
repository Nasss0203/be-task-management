import { Test, TestingModule } from '@nestjs/testing';
import { RemoveTaskFromSprintApplicationImpl } from './remove-task-sprint.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

describe('RemoveTaskFromSprintApplicationImpl', () => {
  let app: RemoveTaskFromSprintApplicationImpl;

  const mockRemoveTaskFromSprintService = { remove: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveTaskFromSprintApplicationImpl,
        { provide: TASK_TYPES.services.RemoveTaskFromSprintService, useValue: mockRemoveTaskFromSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<RemoveTaskFromSprintApplicationImpl>(RemoveTaskFromSprintApplicationImpl);
  });

  it('should remove task from sprint and create activity', async () => {
    mockRemoveTaskFromSprintService.remove.mockResolvedValue({ id: '1', workspaceId: 'ws-1', projectId: 'proj-1', assignees: [] });
    await app.remove({ taskId: '1', userId: 'u-1' });

    expect(mockRemoveTaskFromSprintService.remove).toHaveBeenCalled();
    expect(mockCreateActivityService.create).toHaveBeenCalled();
  });
});
