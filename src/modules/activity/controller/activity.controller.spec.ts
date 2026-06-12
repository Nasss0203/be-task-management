import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';
import { ACTIVITY_TYPES } from '../interfaces/types';

describe('ActivityController', () => {
  let controller: ActivityController;

  const mockApp = {
    findByWorkspace: jest.fn(),
    findByProject: jest.fn(),
    findByEntity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [
        { provide: ACTIVITY_TYPES.applications.FindActivityApplication, useValue: mockApp },
      ],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find by workspace', async () => {
    await controller.findByWorkspace('ws-1', {});
    expect(mockApp.findByWorkspace).toHaveBeenCalled();
  });

  it('should find by project', async () => {
    await controller.findByProject('ws-1', 'proj-1', {});
    expect(mockApp.findByProject).toHaveBeenCalled();
  });

  it('should find by entity', async () => {
    await controller.findByEntity('ws-1', 'task' as any, 'task-1', {});
    expect(mockApp.findByEntity).toHaveBeenCalled();
  });
});
