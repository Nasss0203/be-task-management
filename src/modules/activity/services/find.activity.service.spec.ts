import { Test, TestingModule } from '@nestjs/testing';
import { FindActivityServiceImpl } from './find.activity.service';
import { ACTIVITY_TYPES } from '../interfaces/types';

describe('FindActivityServiceImpl', () => {
  let service: FindActivityServiceImpl;

  const mockRepo = {
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindActivityServiceImpl,
        { provide: ACTIVITY_TYPES.repositories.FindActivityRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FindActivityServiceImpl>(FindActivityServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find activities', async () => {
    mockRepo.findMany.mockResolvedValue({ items: [{ id: 'act-1' }], nextCursor: 'cursor' });

    const result = await service.findMany({
      workspaceId: 'ws-1',
    });

    expect(mockRepo.findMany).toHaveBeenCalled();
    expect(result.items[0].id).toEqual('act-1');
  });
});
