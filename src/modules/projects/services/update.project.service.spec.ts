import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProjectServiceImpl } from './update.project.service';
import { PROJECT_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('UpdateProjectServiceImpl', () => {
  let service: UpdateProjectServiceImpl;

  const mockUpdateProjectRepository = {
    update: jest.fn(),
  };

  const mockFindProjectRepository = {
    findOneProjectById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProjectServiceImpl,
        {
          provide: PROJECT_TYPES.repositories.UpdateProjectRepository,
          useValue: mockUpdateProjectRepository,
        },
        {
          provide: PROJECT_TYPES.repositories.FindProjectRepository,
          useValue: mockFindProjectRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateProjectServiceImpl>(UpdateProjectServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if project does not exist', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue(null);

      await expect(
        service.execute('1', 'workspace-1', {} as any),
      ).rejects.toThrow(NotFoundException);
      expect(mockFindProjectRepository.findOneProjectById).toHaveBeenCalledWith(
        '1',
      );
    });

    it('should throw NotFoundException if project exists but workspace does not match', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue({
        id: '1',
        workspace_id: 'workspace-2',
      });

      await expect(
        service.execute('1', 'workspace-1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call update and return updated project', async () => {
      const mockProject = {
        id: '1',
        workspace_id: 'workspace-1',
        name: 'Updated',
      };
      const dto = { name: 'Updated' } as any;

      mockFindProjectRepository.findOneProjectById
        .mockResolvedValueOnce({ id: '1', workspace_id: 'workspace-1' }) // first call for existence check
        .mockResolvedValueOnce(mockProject); // second call for returning updated project

      mockUpdateProjectRepository.update.mockResolvedValue(undefined);

      const result = await service.execute('1', 'workspace-1', dto);

      expect(mockUpdateProjectRepository.update).toHaveBeenCalledWith(
        '1',
        'workspace-1',
        dto,
      );
      expect(
        mockFindProjectRepository.findOneProjectById,
      ).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project is not found after update', async () => {
      const dto = { name: 'Updated' } as any;

      mockFindProjectRepository.findOneProjectById
        .mockResolvedValueOnce({ id: '1', workspace_id: 'workspace-1' })
        .mockResolvedValueOnce(null);

      mockUpdateProjectRepository.update.mockResolvedValue(undefined);

      await expect(service.execute('1', 'workspace-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
