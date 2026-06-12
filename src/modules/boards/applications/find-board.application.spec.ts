import { Test, TestingModule } from '@nestjs/testing';
import { FindBoardApplicationImpl } from './find-board.application';
import { BOARD_TYPES } from '../interfaces/types';
import { BoardMapper } from '../mapper/boards.mapper';
import { NotFoundException } from '@nestjs/common';

describe('FindBoardApplicationImpl', () => {
  let app: FindBoardApplicationImpl;

  const mockService = {
    findDeletedBoards: jest.fn(),
    findById: jest.fn(),
    findAllByProjectId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindBoardApplicationImpl,
        { provide: BOARD_TYPES.services.FindBoardService, useValue: mockService },
      ],
    }).compile();

    app = module.get<FindBoardApplicationImpl>(FindBoardApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should find deleted boards', async () => {
    const mockBoards = [{ id: 'b-1' }];
    mockService.findDeletedBoards.mockResolvedValue(mockBoards);
    jest.spyOn(BoardMapper, 'toResponse').mockReturnValue(mockBoards[0] as any);

    const result = await app.findDeletedBoards('ws-1', 'p-1');
    expect(mockService.findDeletedBoards).toHaveBeenCalledWith('ws-1', 'p-1');
    expect(result).toEqual(mockBoards);
  });

  it('should find by id', async () => {
    const mockBoard = { id: 'b-1' };
    mockService.findById.mockResolvedValue(mockBoard);
    jest.spyOn(BoardMapper, 'toResponse').mockReturnValue(mockBoard as any);

    const result = await app.findById('b-1');
    expect(mockService.findById).toHaveBeenCalledWith('b-1');
    expect(result).toEqual(mockBoard);
  });

  it('should throw if find by id not found', async () => {
    mockService.findById.mockResolvedValue(null);
    await expect(app.findById('b-1')).rejects.toThrow(NotFoundException);
  });

  it('should find all by project id', async () => {
    const mockBoards = [{ id: 'b-1' }];
    mockService.findAllByProjectId.mockResolvedValue(mockBoards);
    jest.spyOn(BoardMapper, 'toResponse').mockReturnValue(mockBoards[0] as any);

    const result = await app.findAllByProjectId('p-1', 'ws-1');
    expect(mockService.findAllByProjectId).toHaveBeenCalledWith('p-1', 'ws-1');
    expect(result).toEqual(mockBoards);
  });
});
