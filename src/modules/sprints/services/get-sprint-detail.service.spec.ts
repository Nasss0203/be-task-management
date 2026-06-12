import { Test, TestingModule } from '@nestjs/testing';
import { GetSprintDetailServiceImpl } from './get-sprint-detail.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GetSprintDetailServiceImpl', () => {
  let service: GetSprintDetailServiceImpl;

  const mockFindSprintRepository = { findOneSprint: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSprintDetailServiceImpl,
        { provide: SPRINT_TYPES.repositories.FindSprintRepository, useValue: mockFindSprintRepository },
      ],
    }).compile();

    service = module.get<GetSprintDetailServiceImpl>(GetSprintDetailServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSprintDetail', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue(null);
      await expect(service.getSprintDetail({ workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if workspace mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-2' });
      await expect(service.getSprintDetail({ workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-2' });
      await expect(service.getSprintDetail({ workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-1' })).rejects.toThrow(BadRequestException);
    });

    it('should return sprint detail', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', id: 'sprint-1' });
      const result = await service.getSprintDetail({ workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-1' });
      expect(result).toEqual({ workspaceId: 'ws-1', projectId: 'proj-1', id: 'sprint-1' });
    });
  });
});
