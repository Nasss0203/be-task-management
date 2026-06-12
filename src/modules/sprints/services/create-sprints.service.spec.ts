import { Test, TestingModule } from '@nestjs/testing';
import { CreateSprintServiceImpl } from './create-sprints.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { HttpException, BadRequestException, ConflictException } from '@nestjs/common';

describe('CreateSprintServiceImpl', () => {
  let service: CreateSprintServiceImpl;

  const mockCreateSprintRepository = { save: jest.fn() };
  const mockFindSprintRepository = { getNextDefaultSprintName: jest.fn(), existsByProjectIdAndName: jest.fn() };
  const mockFindProjectRepository = { findOneProjectById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSprintServiceImpl,
        { provide: SPRINT_TYPES.repositories.CreateSprintRepository, useValue: mockCreateSprintRepository },
        { provide: SPRINT_TYPES.repositories.FindSprintRepository, useValue: mockFindSprintRepository },
        { provide: PROJECT_TYPES.repositories.FindProjectRepository, useValue: mockFindProjectRepository },
      ],
    }).compile();

    service = module.get<CreateSprintServiceImpl>(CreateSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue(null);
      await expect(service.create({ workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw BadRequestException if project workspace mismatch', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue({ workspace_id: 'ws-2' });
      await expect(service.create({ workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if sprint name exists', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue({ workspace_id: 'ws-1' });
      mockFindSprintRepository.existsByProjectIdAndName.mockResolvedValue(true);
      await expect(service.create({ workspaceId: 'ws-1', projectId: 'proj-1', name: 'Sprint 1' } as any)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if startAt >= endAt', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue({ workspace_id: 'ws-1' });
      mockFindSprintRepository.existsByProjectIdAndName.mockResolvedValue(false);
      await expect(
        service.create({ workspaceId: 'ws-1', projectId: 'proj-1', startAt: new Date('2023-01-02'), endAt: new Date('2023-01-01') } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should create sprint with default name if name is empty', async () => {
      mockFindProjectRepository.findOneProjectById.mockResolvedValue({ workspace_id: 'ws-1' });
      mockFindSprintRepository.existsByProjectIdAndName.mockResolvedValue(false);
      mockFindSprintRepository.getNextDefaultSprintName.mockResolvedValue('Sprint 1');
      mockCreateSprintRepository.save.mockResolvedValue({ id: 'sprint-1' });

      const result = await service.create({ workspaceId: 'ws-1', projectId: 'proj-1' } as any);

      expect(mockCreateSprintRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Sprint 1' }),
        undefined
      );
      expect(result).toEqual({ id: 'sprint-1' });
    });
  });
});
