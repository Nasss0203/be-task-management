import { Test, TestingModule } from '@nestjs/testing';
import { CreateBoardServiceImpl } from './create.boards.service';
import { BOARD_TYPES } from '../interfaces/types';
import { BadRequestException } from '@nestjs/common';

describe('CreateBoardServiceImpl', () => {
  let service: CreateBoardServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBoardServiceImpl,
        { provide: BOARD_TYPES.repositories.CreateBoardRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreateBoardServiceImpl>(CreateBoardServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create board', async () => {
    mockRepo.save.mockResolvedValue({ id: 'b-1' });
    const dto = { name: 'Board 1', createdBy: 'u-1', workspaceId: 'ws-1', projectId: 'p-1', viewType: 'list' } as any;
    
    const result = await service.create(dto, {} as any);
    
    expect(mockRepo.save).toHaveBeenCalledWith({ name: 'Board 1', createdBy: 'u-1', workspaceId: 'ws-1', projectId: 'p-1', viewType: 'list' }, {});
    expect(result).toEqual({ id: 'b-1' });
  });

  it('should throw if createdBy is missing', async () => {
    const dto = { name: 'Board 1', workspaceId: 'ws-1', projectId: 'p-1', viewType: 'list' } as any;
    expect(() => service.create(dto, {} as any)).toThrow(BadRequestException);
  });
});
