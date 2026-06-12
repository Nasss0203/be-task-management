import { Test, TestingModule } from '@nestjs/testing';
import { FindBoardServiceImpl } from './find-board.service';
import { BOARD_TYPES } from '../interfaces/types';

describe('FindBoardServiceImpl', () => {
  let service: FindBoardServiceImpl;

  const mockRepo = {
    findDeletedBoards: jest.fn(),
    findOneBoardForRestore: jest.fn(),
    findById: jest.fn(),
    findAllByProjectId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindBoardServiceImpl,
        { provide: BOARD_TYPES.repositories.FindBoardRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FindBoardServiceImpl>(FindBoardServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find deleted boards', async () => {
    mockRepo.findDeletedBoards.mockResolvedValue([{ id: 'b-1' }]);
    const result = await service.findDeletedBoards('ws-1', 'p-1');
    expect(mockRepo.findDeletedBoards).toHaveBeenCalledWith('ws-1', 'p-1');
    expect(result).toEqual([{ id: 'b-1' }]);
  });

  it('should find one board for restore', async () => {
    mockRepo.findOneBoardForRestore.mockResolvedValue({ id: 'b-1' });
    const result = await service.findOneBoardForRestore('ws-1', 'p-1', 'b-1');
    expect(mockRepo.findOneBoardForRestore).toHaveBeenCalledWith('ws-1', 'p-1', 'b-1');
    expect(result).toEqual({ id: 'b-1' });
  });

  it('should find by id', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'b-1' });
    const result = await service.findById('b-1');
    expect(mockRepo.findById).toHaveBeenCalledWith('b-1');
    expect(result).toEqual({ id: 'b-1' });
  });

  it('should find all by project id', async () => {
    mockRepo.findAllByProjectId.mockResolvedValue([{ id: 'b-1' }]);
    const result = await service.findAllByProjectId('p-1', 'ws-1');
    expect(mockRepo.findAllByProjectId).toHaveBeenCalledWith({ projectId: 'p-1', workspaceId: 'ws-1' });
    expect(result).toEqual([{ id: 'b-1' }]);
  });
});
