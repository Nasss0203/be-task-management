import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTaskApplicationImpl } from './update-task.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

describe('UpdateTaskApplicationImpl', () => {
  let app: UpdateTaskApplicationImpl;

  const mockUpdateTaskService = { updateTask: jest.fn(), updateManyTasks: jest.fn() };
  const mockFindTaskService = { findOneTask: jest.fn(), findByIds: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockFindPermissionService = { findPermissionsByUserAndWorkspace: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTaskApplicationImpl,
        { provide: TASK_TYPES.services.UpdateTaskService, useValue: mockUpdateTaskService },
        { provide: TASK_TYPES.services.FindTaskService, useValue: mockFindTaskService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: PERMISSION_TYPES.services.FindPermissionService, useValue: mockFindPermissionService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
      ],
    }).compile();

    app = module.get<UpdateTaskApplicationImpl>(UpdateTaskApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('updateTask', () => {
    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(app.updateTask({ id: '1', actorId: 'user-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot update status/priority', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({ id: '1', statusId: 's-1', assignees: [] });
      mockFindPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue([]);
      
      await expect(app.updateTask({ id: '1', actorId: 'user-1', statusId: 's-2' })).rejects.toThrow(ForbiddenException);
    });

    it('should update task and log activity if user has permission', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({ id: '1', statusId: 's-1', title: 'old title', assignees: [] });
      mockFindPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue([PERMISSIONS.WORKSPACE_UPDATE]);
      mockUpdateTaskService.updateTask.mockResolvedValue({ id: '1', statusId: 's-2', title: 'new title', assignees: [] });
      
      await app.updateTask({ id: '1', actorId: 'user-1', statusId: 's-2', title: 'new title' });

      expect(mockUpdateTaskService.updateTask).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalledTimes(2); // One for status, one for title
    });
  });

  describe('updateManyTasks', () => {
    it('should throw BadRequestException if workspaceId is missing', async () => {
      await expect(app.updateManyTasks({ projectId: 'p-1', actorId: 'u-1', dto: {} as any } as any)).rejects.toThrow(BadRequestException);
    });

    it('should update many tasks without status/priority change without checking permissions', async () => {
      mockUpdateTaskService.updateManyTasks.mockResolvedValue([{ id: '1', assignees: [] }]);
      await app.updateManyTasks({ workspaceId: 'w-1', projectId: 'p-1', actorId: 'u-1', dto: { taskIds: ['1'] } } as any);
      expect(mockUpdateTaskService.updateManyTasks).toHaveBeenCalled();
    });

    it('should throw NotFoundException if some tasks are missing when updating status', async () => {
      mockFindTaskService.findByIds.mockResolvedValue([{ id: '1', assignees: [] }]);
      await expect(app.updateManyTasks({ workspaceId: 'w-1', projectId: 'p-1', actorId: 'u-1', dto: { taskIds: ['1', '2'], statusId: 's-1' } } as any)).rejects.toThrow(NotFoundException);
    });
  });
});
