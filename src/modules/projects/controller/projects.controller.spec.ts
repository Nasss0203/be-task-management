import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { PROJECT_TYPES } from '../interfaces/types';
import { BadRequestException } from '@nestjs/common';
import { IAuth } from 'src/types/auth';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockFindProjectApplication = {
    findAllByWorkspaceId: jest.fn(),
    findDeletedProjects: jest.fn(),
  };

  const mockCreateProjectApplication = {
    createProjectWithPageBlock: jest.fn(),
  };

  const mockUpdateProjectApplication = {
    execute: jest.fn(),
  };

  const mockDeleteProjectApplication = {
    delete: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: PROJECT_TYPES.applications.FindProjectApplication,
          useValue: mockFindProjectApplication,
        },
        {
          provide: PROJECT_TYPES.applications.CreateProjectApplication,
          useValue: mockCreateProjectApplication,
        },
        {
          provide: PROJECT_TYPES.applications.UpdateProjectApplication,
          useValue: mockUpdateProjectApplication,
        },
        {
          provide: PROJECT_TYPES.applications.DeleteProjectApplication,
          useValue: mockDeleteProjectApplication,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllByWorkspaceId', () => {
    it('should call findAllByWorkspaceId on application', async () => {
      mockFindProjectApplication.findAllByWorkspaceId.mockResolvedValue([]);
      const result = await controller.findAllByWorkspaceId('ws-1');
      expect(mockFindProjectApplication.findAllByWorkspaceId).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual([]);
    });
  });

  describe('createProjectWithPageBlock', () => {
    it('should call createProjectWithPageBlock on application', async () => {
      const dto = { name: 'Test' } as any;
      const auth = { id: 'usr-1' } as IAuth;
      mockCreateProjectApplication.createProjectWithPageBlock.mockResolvedValue({ id: '1' });
      
      const result = await controller.createProjectWithPageBlock(dto, auth);
      
      expect(mockCreateProjectApplication.createProjectWithPageBlock).toHaveBeenCalledWith({
        ...dto,
        created_by: 'usr-1',
      });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('findDeletedProjects', () => {
    it('should throw BadRequestException if workspaceId is not provided', async () => {
      await expect(controller.findDeletedProjects('')).rejects.toThrow(BadRequestException);
    });

    it('should call findDeletedProjects on application', async () => {
      mockFindProjectApplication.findDeletedProjects.mockResolvedValue([]);
      const result = await controller.findDeletedProjects('ws-1');
      expect(mockFindProjectApplication.findDeletedProjects).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual([]);
    });
  });

  describe('updateProject', () => {
    it('should call execute on update application', async () => {
      const dto = { name: 'Update' } as any;
      mockUpdateProjectApplication.execute.mockResolvedValue({ id: '1' });
      const result = await controller.updateProject('ws-1', '1', dto);
      expect(mockUpdateProjectApplication.execute).toHaveBeenCalledWith('1', 'ws-1', dto);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('deleteProject', () => {
    it('should call delete on delete application', async () => {
      const auth = { id: 'usr-1' } as IAuth;
      mockDeleteProjectApplication.delete.mockResolvedValue(undefined);
      
      const result = await controller.deleteProject('ws-1', '1', auth);
      
      expect(mockDeleteProjectApplication.delete).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: '1',
        userId: 'usr-1',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('restoreProject', () => {
    it('should call restore on delete application', async () => {
      const auth = { id: 'usr-1' } as IAuth;
      mockDeleteProjectApplication.restore.mockResolvedValue(undefined);
      
      const result = await controller.restoreProject('ws-1', '1', auth);
      
      expect(mockDeleteProjectApplication.restore).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: '1',
        userId: 'usr-1',
      });
      expect(result).toEqual({ success: true });
    });
  });
});
