import { Test, TestingModule } from '@nestjs/testing';
import { DeleteBoardApplicationImpl } from './delete-board.application';
import { BOARD_TYPES } from '../interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DeleteBoardApplicationImpl', () => {
  let app: DeleteBoardApplicationImpl;

  const mockFindBoardService = {
    findOneBoardForRestore: jest.fn(),
  };

  const mockDeleteBoardService = {
    softDeleteBoard: jest.fn(),
    restoreBoard: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteBoardApplicationImpl,
        { provide: BOARD_TYPES.services.FindBoardService, useValue: mockFindBoardService },
        { provide: BOARD_TYPES.services.DeleteBoardService, useValue: mockDeleteBoardService },
      ],
    }).compile();

    app = module.get<DeleteBoardApplicationImpl>(DeleteBoardApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('delete', () => {
    it('should delete board', async () => {
      mockFindBoardService.findOneBoardForRestore.mockResolvedValue({ id: 'b-1' });
      await app.delete({ workspaceId: 'ws-1', projectId: 'p-1', boardId: 'b-1', userId: 'u-1' });
      expect(mockDeleteBoardService.softDeleteBoard).toHaveBeenCalledWith({ boardId: 'b-1', deletedBy: 'u-1' });
    });

    it('should throw if not found', async () => {
      mockFindBoardService.findOneBoardForRestore.mockResolvedValue(null);
      await expect(app.delete({ workspaceId: 'ws-1', projectId: 'p-1', boardId: 'b-1', userId: 'u-1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if already deleted', async () => {
      mockFindBoardService.findOneBoardForRestore.mockResolvedValue({ id: 'b-1', deletedAt: new Date() });
      await expect(app.delete({ workspaceId: 'ws-1', projectId: 'p-1', boardId: 'b-1', userId: 'u-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('restore', () => {
    it('should restore board', async () => {
      mockFindBoardService.findOneBoardForRestore.mockResolvedValue({ id: 'b-1', deletedAt: new Date() });
      await app.restore({ workspaceId: 'ws-1', projectId: 'p-1', boardId: 'b-1', userId: 'u-1' });
      expect(mockDeleteBoardService.restoreBoard).toHaveBeenCalledWith({ boardId: 'b-1' });
    });

    it('should throw if not deleted', async () => {
      mockFindBoardService.findOneBoardForRestore.mockResolvedValue({ id: 'b-1' });
      await expect(app.restore({ workspaceId: 'ws-1', projectId: 'p-1', boardId: 'b-1', userId: 'u-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
