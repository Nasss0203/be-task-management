import { Test, TestingModule } from '@nestjs/testing';
import { StartSprintServiceImpl } from './start-sprint.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';

describe('StartSprintServiceImpl', () => {
  let service: StartSprintServiceImpl;

  const mockStartSprintRepository = { startSprint: jest.fn() };
  const mockFindSprintRepository = { findOneSprint: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartSprintServiceImpl,
        {
          provide: SPRINT_TYPES.repositories.StartSprintRepository,
          useValue: mockStartSprintRepository,
        },
        {
          provide: SPRINT_TYPES.repositories.FindSprintRepository,
          useValue: mockFindSprintRepository,
        },
      ],
    }).compile();

    service = module.get<StartSprintServiceImpl>(StartSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSprint', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue(null);
      await expect(
        service.startSprint({
          sprintId: '1',
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
        service.startSprint({
          sprintId: '1',
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
        service.startSprint({
          sprintId: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is not planned', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.ACTIVE,
      });
      await expect(
        service.startSprint({
          sprintId: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
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
        service.startSprint({
          sprintId: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          startAt: new Date('2023-01-02'),
          endAt: new Date('2023-01-01'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name is empty string', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
      });
      await expect(
        service.startSprint({
          sprintId: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          name: '',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if startAt is invalid date', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
      });
      await expect(
        service.startSprint({
          sprintId: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          startAt: new Date('invalid'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if startSprint fails', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
        startAt: new Date(),
        endAt: new Date(Date.now() + 10000),
      });
      mockStartSprintRepository.startSprint.mockResolvedValue(null);
      await expect(
        service.startSprint({
          sprintId: '1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should start sprint', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.PLANNED,
        startAt: new Date(),
        endAt: new Date(Date.now() + 10000),
      });
      mockStartSprintRepository.startSprint.mockResolvedValue({ id: '1' });
      const result = await service.startSprint({
        sprintId: '1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      } as any);
      expect(result).toEqual({ id: '1' });
    });
  });
});
