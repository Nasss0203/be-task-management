import { Test, TestingModule } from '@nestjs/testing';
import { FindProjectApplicationImpl } from './find.project.application';
import { PROJECT_TYPES } from '../interfaces/types';
import { ProjectMapper } from '../mapper/projects.mapper';

describe('FindProjectApplicationImpl', () => {
  let application: FindProjectApplicationImpl;

  const mockFindProjectService = {
    findDeletedProjects: jest.fn(),
    findAllByWorkspaceId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindProjectApplicationImpl,
        {
          provide: PROJECT_TYPES.services.FindProjectService,
          useValue: mockFindProjectService,
        },
      ],
    }).compile();

    application = module.get<FindProjectApplicationImpl>(
      FindProjectApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('findDeletedProjects', () => {
    it('should call findDeletedProjects on service and map to response', async () => {
      const mockProject = { id: '1', name: 'Test' } as any;
      mockFindProjectService.findDeletedProjects.mockResolvedValue([
        mockProject,
      ]);

      const spyMapper = jest
        .spyOn(ProjectMapper, 'toResponse')
        .mockReturnValue({ id: '1', name: 'Test' } as any);

      const result = await application.findDeletedProjects('workspace-1');

      expect(mockFindProjectService.findDeletedProjects).toHaveBeenCalledWith(
        'workspace-1',
      );
      expect(spyMapper).toHaveBeenCalledWith(mockProject);
      expect(result).toEqual([{ id: '1', name: 'Test' }]);
    });
  });

  describe('findAllByWorkspaceId', () => {
    it('should call findAllByWorkspaceId on service and map to response', async () => {
      const mockProject = { id: '2', name: 'Test 2' } as any;
      mockFindProjectService.findAllByWorkspaceId.mockResolvedValue([
        mockProject,
      ]);

      const spyMapper = jest
        .spyOn(ProjectMapper, 'toResponse')
        .mockReturnValue({ id: '2', name: 'Test 2' } as any);

      const result = await application.findAllByWorkspaceId('workspace-2');

      expect(mockFindProjectService.findAllByWorkspaceId).toHaveBeenCalledWith(
        'workspace-2',
      );
      expect(spyMapper).toHaveBeenCalledWith(mockProject);
      expect(result).toEqual([{ id: '2', name: 'Test 2' }]);
    });
  });
});
