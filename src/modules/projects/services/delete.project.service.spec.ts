import { Test, TestingModule } from '@nestjs/testing';
import { DeleteProjectServiceImpl } from './delete.project.service';
import { PROJECT_TYPES } from '../interfaces/types';

describe('DeleteProjectServiceImpl', () => {
  let service: DeleteProjectServiceImpl;

  const mockDeleteProjectRepository = {
    softDeleteProject: jest.fn(),
    restoreProject: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProjectServiceImpl,
        {
          provide: PROJECT_TYPES.repositories.DeleteProjectRepository,
          useValue: mockDeleteProjectRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteProjectServiceImpl>(DeleteProjectServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDeleteProject', () => {
    it('should call softDeleteProject on repository', async () => {
      const input = { projectId: '1', deletedBy: 'user-1' };
      const manager = {} as any;
      
      mockDeleteProjectRepository.softDeleteProject.mockResolvedValue(undefined);

      await service.softDeleteProject(input, manager);

      expect(mockDeleteProjectRepository.softDeleteProject).toHaveBeenCalledWith(input, manager);
    });
  });

  describe('restoreProject', () => {
    it('should call restoreProject on repository', async () => {
      const input = { projectId: '1' };
      const manager = {} as any;
      
      mockDeleteProjectRepository.restoreProject.mockResolvedValue(undefined);

      await service.restoreProject(input, manager);

      expect(mockDeleteProjectRepository.restoreProject).toHaveBeenCalledWith(input, manager);
    });
  });
});
