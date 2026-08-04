import { Test, TestingModule } from '@nestjs/testing';
import { CreateActivityServiceImpl } from './create.activity.service';
import { ACTIVITY_TYPES } from '../interfaces/types';

describe('CreateActivityServiceImpl', () => {
  let service: CreateActivityServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateActivityServiceImpl,
        {
          provide: ACTIVITY_TYPES.repositories.CreateActivityRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CreateActivityServiceImpl>(CreateActivityServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create activity', async () => {
    mockRepo.save.mockResolvedValue({ id: 'act-1' });

    const result = await service.create({
      workspaceId: 'ws-1',
      entityType: 'task' as any,
      entityId: 't-1',
      action: 'CREATE',
    });

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toEqual('act-1');
  });
});
