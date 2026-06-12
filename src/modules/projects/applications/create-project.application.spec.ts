import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectApplicationImpl } from './create-project.application';
import { PROJECT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';
import { ProjectMapper } from '../mapper/projects.mapper';

describe('CreateProjectApplicationImpl', () => {
  let application: CreateProjectApplicationImpl;

  const mockCreateProjectService = {
    create: jest.fn(),
    createProjectWithPageBlock: jest.fn(),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProjectApplicationImpl,
        {
          provide: PROJECT_TYPES.services.CreateProjectService,
          useValue: mockCreateProjectService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
      ],
    }).compile();

    application = module.get<CreateProjectApplicationImpl>(CreateProjectApplicationImpl);
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('create', () => {
    it('should call create on service, create activity, and return mapped response', async () => {
      const mockDto = { created_by: 'usr-1' } as any;
      const mockModel = { id: 'proj-1', workspace_id: 'ws-1', name: 'Test', key: 'TEST-1', visibility: 'PUBLIC' } as any;
      
      mockCreateProjectService.create.mockResolvedValue(mockModel);
      mockCreateActivityService.create.mockResolvedValue(undefined);
      
      const spyMapper = jest.spyOn(ProjectMapper, 'toResponse').mockReturnValue(mockModel);

      const result = await application.create(mockDto);

      expect(mockCreateProjectService.create).toHaveBeenCalledWith(mockDto);
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        entityType: ActivityEntityType.PROJECT,
        entityId: 'proj-1',
        actorId: 'usr-1',
        action: ActivityAction.PROJECT_CREATED,
        metadata: {
          name: 'Test',
          key: 'TEST-1',
          visibility: 'PUBLIC',
        },
      });
      expect(spyMapper).toHaveBeenCalledWith(mockModel);
      expect(result).toEqual(mockModel);
    });
  });

  describe('createProjectWithPageBlock', () => {
    it('should call createProjectWithPageBlock on service, create activity, and return mapped response', async () => {
      const mockDto = { created_by: 'usr-1' } as any;
      const mockModel = { id: 'proj-1', workspace_id: 'ws-1', name: 'Test', key: 'TEST-1', visibility: 'PUBLIC' } as any;
      
      mockCreateProjectService.createProjectWithPageBlock.mockResolvedValue(mockModel);
      mockCreateActivityService.create.mockResolvedValue(undefined);
      
      const spyMapper = jest.spyOn(ProjectMapper, 'toResponse').mockReturnValue(mockModel);

      const result = await application.createProjectWithPageBlock(mockDto);

      expect(mockCreateProjectService.createProjectWithPageBlock).toHaveBeenCalledWith(mockDto);
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        entityType: ActivityEntityType.PROJECT,
        entityId: 'proj-1',
        actorId: 'usr-1',
        action: ActivityAction.PROJECT_CREATED,
        metadata: {
          name: 'Test',
          key: 'TEST-1',
          visibility: 'PUBLIC',
        },
      });
      expect(spyMapper).toHaveBeenCalledWith(mockModel);
      expect(result).toEqual(mockModel);
    });
  });
});
