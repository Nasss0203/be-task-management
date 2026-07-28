import { Test, TestingModule } from '@nestjs/testing';
import { DeleteBoardApplicationImpl } from './delete-board.application';
import { BOARD_TYPES } from '../interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';

describe('DeleteBoardApplicationImpl', () => {
  let app: DeleteBoardApplicationImpl;

  const mockManager = {} as any;

  const mockFindBoardService = {
    findOneBoardForRestore: jest.fn(),
  };

  const mockDeleteBoardService = {
    softDeleteBoard: jest.fn(),
    restoreBoard: jest.fn(),
  };

  const mockUnitOfWork = {
    runInTransaction: jest.fn(async (fn: (manager: unknown) => Promise<unknown>) =>
      fn(mockManager),
    ),
  };

  const mockFindPageBlockService = {
    findActiveDatabaseViewBlocksByBoardId: jest.fn(),
  };

  const mockUpdatePageBlockService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteBoardApplicationImpl,
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: BOARD_TYPES.services.FindBoardService, useValue: mockFindBoardService },
        { provide: BOARD_TYPES.services.DeleteBoardService, useValue: mockDeleteBoardService },
        {
          provide: PAGE_BLOCK_TYPES.services.FindPageBlockService,
          useValue: mockFindPageBlockService,
        },
        {
          provide: PAGE_BLOCK_TYPES.services.UpdatePageBlockService,
          useValue: mockUpdatePageBlockService,
        },
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
      mockFindPageBlockService.findActiveDatabaseViewBlocksByBoardId.mockResolvedValue([]);
      await app.delete({ workspaceId: 'ws-1', projectId: 'p-1', boardId: 'b-1', userId: 'u-1' });
      expect(mockDeleteBoardService.softDeleteBoard).toHaveBeenCalledWith(
        { boardId: 'b-1', deletedBy: 'u-1' },
        mockManager,
      );
    });

    it('should clear default board references after delete', async () => {
      mockFindBoardService.findOneBoardForRestore.mockResolvedValue({ id: 'b-1' });
      mockFindPageBlockService.findActiveDatabaseViewBlocksByBoardId.mockResolvedValue([
        {
          id: 'pb-1',
          data_config: {
            project_id: 'p-1',
            workspace_id: 'ws-1',
            default_board_id: 'b-1',
            default_view_type: 'BOARD',
          },
        },
      ]);

      await app.delete({
        workspaceId: 'ws-1',
        projectId: 'p-1',
        boardId: 'b-1',
        userId: 'u-1',
      });

      expect(
        mockFindPageBlockService.findActiveDatabaseViewBlocksByBoardId,
      ).toHaveBeenCalledWith('b-1', mockManager);
      expect(mockUpdatePageBlockService.update).toHaveBeenCalledWith(
        {
          id: 'pb-1',
          data_config: {
            project_id: 'p-1',
            workspace_id: 'ws-1',
            default_board_id: null,
            default_view_type: 'BOARD',
          },
        },
        mockManager,
      );
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
