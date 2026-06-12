import { Test, TestingModule } from '@nestjs/testing';
import { FindActivityApplicationImpl } from './find-activity.application';
import { ACTIVITY_TYPES } from '../interfaces/types';

describe('FindActivityApplicationImpl', () => {
  let application: FindActivityApplicationImpl;

  const mockService = {
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindActivityApplicationImpl,
        { provide: ACTIVITY_TYPES.services.FindActivityService, useValue: mockService },
      ],
    }).compile();

    application = module.get<FindActivityApplicationImpl>(FindActivityApplicationImpl);
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  it('should find by workspace', async () => {
    mockService.findMany.mockResolvedValue({ items: [], nextCursor: null });
    await application.findByWorkspace('ws-1', { limit: 10 });
    expect(mockService.findMany).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws-1', limit: 10 }));
  });

  it('should find by project', async () => {
    mockService.findMany.mockResolvedValue({ items: [], nextCursor: null });
    await application.findByProject('ws-1', 'proj-1', {});
    expect(mockService.findMany).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws-1', projectId: 'proj-1' }));
  });

  it('should find by entity', async () => {
    mockService.findMany.mockResolvedValue({ items: [], nextCursor: null });
    await application.findByEntity('ws-1', 'task' as any, 'task-1', {});
    expect(mockService.findMany).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws-1', entityType: 'task', entityId: 'task-1' }));
  });
});
