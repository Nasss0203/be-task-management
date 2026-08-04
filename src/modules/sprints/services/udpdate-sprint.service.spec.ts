import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSprintServiceImpl } from './udpdate-sprint.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';

describe('UpdateSprintServiceImpl', () => {
  let service: UpdateSprintServiceImpl;

  const mockFindSprintRepository = { findOneSprint: jest.fn() };
  const mockUpdateSprintRepository = { updateSprint: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSprintServiceImpl,
        {
          provide: SPRINT_TYPES.repositories.FindSprintRepository,
          useValue: mockFindSprintRepository,
        },
        {
          provide: SPRINT_TYPES.repositories.UpdateSprintRepository,
          useValue: mockUpdateSprintRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateSprintServiceImpl>(UpdateSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateSprint', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue(null);
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if workspace mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-2',
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-2',
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is completed', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.COMPLETED,
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is cancelled', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.CANCELLED,
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint name is empty string', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          name: '   ',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if updating locked field of active sprint', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.ACTIVE,
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          name: 'New Name',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if startAt >= endAt', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
      });
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          startAt: new Date('2023-01-02'),
          endAt: new Date('2023-01-01'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if update fails', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
      });
      mockUpdateSprintRepository.updateSprint.mockResolvedValue(null);
      await expect(
        service.updateSprint({
          id: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          name: 'Valid',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update sprint', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
      });
      mockUpdateSprintRepository.updateSprint.mockResolvedValue({ id: '1' });
      const result = await service.updateSprint({
        id: '1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Valid',
      } as any);
      expect(result).toEqual({ id: '1' });
    });
  });
});
