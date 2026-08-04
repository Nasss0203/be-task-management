import { Test, TestingModule } from '@nestjs/testing';
import { FindProjectServiceImpl } from './find.project.service';
import { PROJECT_TYPES } from '../interfaces/types';

describe('FindProjectServiceImpl', () => {
  let service: FindProjectServiceImpl;

  const mockFindProjectRepository = {
    findDeletedProjects: jest.fn(),
    findOneProjectForRestore: jest.fn(),
    existsActiveProjectKey: jest.fn(),
    findAllByWorkspaceId: jest.fn(),
    findOneProjectById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindProjectServiceImpl,
        {
          provide: PROJECT_TYPES.repositories.FindProjectRepository,
          useValue: mockFindProjectRepository,
        },
      ],
    }).compile();

    service = module.get<FindProjectServiceImpl>(FindProjectServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDeletedProjects', () => {
    it('should call findDeletedProjects on repository', async () => {
      const mockProjects = [{ id: '1' }];
      mockFindProjectRepository.findDeletedProjects.mockResolvedValue(
        mockProjects,
      );

      const result = await service.findDeletedProjects('workspace-1');

      expect(
        mockFindProjectRepository.findDeletedProjects,
      ).toHaveBeenCalledWith('workspace-1');
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOneProjectForRestore', () => {
    it('should call findOneProjectForRestore on repository', async () => {
      const mockProject = { id: '1' };
      mockFindProjectRepository.findOneProjectForRestore.mockResolvedValue(
        mockProject,
      );

      const result = await service.findOneProjectForRestore('workspace-1', '1');

      expect(
        mockFindProjectRepository.findOneProjectForRestore,
      ).toHaveBeenCalledWith('workspace-1', '1');
      expect(result).toEqual(mockProject);
    });
  });

  describe('existsActiveProjectKey', () => {
    it('should call existsActiveProjectKey on repository', async () => {
      mockFindProjectRepository.existsActiveProjectKey.mockResolvedValue(true);

      const result = await service.existsActiveProjectKey(
        'workspace-1',
        'KEY',
        'exclude-1',
      );

      expect(
        mockFindProjectRepository.existsActiveProjectKey,
      ).toHaveBeenCalledWith('workspace-1', 'KEY', 'exclude-1');
      expect(result).toBe(true);
    });
  });

  describe('findAllByWorkspaceId', () => {
    it('should call findAllByWorkspaceId on repository', async () => {
      const mockProjects = [{ id: '1' }];
      mockFindProjectRepository.findAllByWorkspaceId.mockResolvedValue(
        mockProjects,
      );

      const result = await service.findAllByWorkspaceId('workspace-1');

      expect(
        mockFindProjectRepository.findAllByWorkspaceId,
      ).toHaveBeenCalledWith('workspace-1');
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOneProjectById', () => {
    it('should call findOneProjectById on repository', async () => {
      const mockProject = { id: '1' };
      const manager = {} as any;
      mockFindProjectRepository.findOneProjectById.mockResolvedValue(
        mockProject,
      );

      const result = await service.findOneProjectById('1', manager);

      expect(mockFindProjectRepository.findOneProjectById).toHaveBeenCalledWith(
        '1',
        manager,
      );
      expect(result).toEqual(mockProject);
    });
  });
});
