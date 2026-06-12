import { Test, TestingModule } from '@nestjs/testing';
import { DeletePageBlockApplicationImpl } from './delete.page-block.application';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';

describe('DeletePageBlockApplicationImpl', () => {
  let app: DeletePageBlockApplicationImpl;

  const mockFindService = {
    findOnePageBlockForRestore: jest.fn(),
  };

  const mockDeleteService = {
    softDeletePageBlock: jest.fn(),
    restorePageBlock: jest.fn(),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePageBlockApplicationImpl,
        { provide: PAGE_BLOCK_TYPES.services.FindPageBlockService, useValue: mockFindService },
        { provide: PAGE_BLOCK_TYPES.services.DeletePageBlockService, useValue: mockDeleteService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<DeletePageBlockApplicationImpl>(DeletePageBlockApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('delete', () => {
    it('should delete page block', async () => {
      mockFindService.findOnePageBlockForRestore.mockResolvedValue({ id: 'pb-1', pageId: 'page-1' });
      await app.delete({ workspaceId: 'ws-1', blockId: 'pb-1', userId: 'u-1' });

      expect(mockDeleteService.softDeletePageBlock).toHaveBeenCalledWith({ blockId: 'pb-1', deletedBy: 'u-1' });
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.PAGE_BLOCK,
        entityId: 'pb-1',
        actorId: 'u-1',
        action: ActivityAction.PAGE_BLOCK_DELETED,
        metadata: { pageId: 'page-1' },
      });
    });

    it('should throw if not found', async () => {
      mockFindService.findOnePageBlockForRestore.mockResolvedValue(null);
      await expect(app.delete({ workspaceId: 'ws-1', blockId: 'pb-1', userId: 'u-1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if already deleted', async () => {
      mockFindService.findOnePageBlockForRestore.mockResolvedValue({ id: 'pb-1', deletedAt: new Date() });
      await expect(app.delete({ workspaceId: 'ws-1', blockId: 'pb-1', userId: 'u-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('restore', () => {
    it('should restore page block', async () => {
      mockFindService.findOnePageBlockForRestore.mockResolvedValue({ id: 'pb-1', deletedAt: new Date(), pageId: 'page-1' });
      await app.restore({ workspaceId: 'ws-1', blockId: 'pb-1', userId: 'u-1' });

      expect(mockDeleteService.restorePageBlock).toHaveBeenCalledWith({ blockId: 'pb-1' });
    });

    it('should throw if not deleted', async () => {
      mockFindService.findOnePageBlockForRestore.mockResolvedValue({ id: 'pb-1' });
      await expect(app.restore({ workspaceId: 'ws-1', blockId: 'pb-1', userId: 'u-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
