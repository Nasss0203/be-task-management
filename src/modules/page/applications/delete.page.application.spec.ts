import { Test, TestingModule } from '@nestjs/testing';
import { DeletePageApplicationImpl } from './delete.page.application';
import { PAGE_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';

describe('DeletePageApplicationImpl', () => {
  let app: DeletePageApplicationImpl;

  const mockFindPageService = {
    findOnePageForRestore: jest.fn(),
  };

  const mockDeletePageService = {
    softDeletePage: jest.fn(),
    restorePage: jest.fn(),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePageApplicationImpl,
        { provide: PAGE_TYPES.services.FindPageService, useValue: mockFindPageService },
        { provide: PAGE_TYPES.services.DeletePageService, useValue: mockDeletePageService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<DeletePageApplicationImpl>(DeletePageApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('delete', () => {
    it('should delete page', async () => {
      mockFindPageService.findOnePageForRestore.mockResolvedValue({ id: 'page-1' });
      await app.delete({ workspaceId: 'ws-1', pageId: 'page-1', userId: 'u-1' });

      expect(mockDeletePageService.softDeletePage).toHaveBeenCalledWith({ pageId: 'page-1', deletedBy: 'u-1' });
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.PAGE,
        entityId: 'page-1',
        actorId: 'u-1',
        action: ActivityAction.PAGE_DELETED,
      });
    });

    it('should throw if not found', async () => {
      mockFindPageService.findOnePageForRestore.mockResolvedValue(null);
      await expect(app.delete({ workspaceId: 'ws-1', pageId: 'page-1', userId: 'u-1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if already deleted', async () => {
      mockFindPageService.findOnePageForRestore.mockResolvedValue({ id: 'page-1', deletedAt: new Date() });
      await expect(app.delete({ workspaceId: 'ws-1', pageId: 'page-1', userId: 'u-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('restore', () => {
    it('should restore page', async () => {
      mockFindPageService.findOnePageForRestore.mockResolvedValue({ id: 'page-1', deletedAt: new Date() });
      await app.restore({ workspaceId: 'ws-1', pageId: 'page-1', userId: 'u-1' });

      expect(mockDeletePageService.restorePage).toHaveBeenCalledWith({ pageId: 'page-1' });
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.PAGE,
        entityId: 'page-1',
        actorId: 'u-1',
        action: ActivityAction.PAGE_RESTORED,
      });
    });

    it('should throw if not deleted', async () => {
      mockFindPageService.findOnePageForRestore.mockResolvedValue({ id: 'page-1' });
      await expect(app.restore({ workspaceId: 'ws-1', pageId: 'page-1', userId: 'u-1' }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
