import { Test, TestingModule } from '@nestjs/testing';
import { FindSprintServiceImpl } from './find-sprint-service';
import { SPRINT_TYPES } from '../interfaces/types';

describe('FindSprintServiceImpl', () => {
  let service: FindSprintServiceImpl;

  const mockFindSprintRepository = {
    findDeletedSprints: jest.fn(),
    findOneSprintForRestore: jest.fn(),
    findOneSprint: jest.fn(),
    findAllSprintByProject: jest.fn(),
    findTasksBySprint: jest.fn(),
    getSprintProgress: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSprintServiceImpl,
        { provide: SPRINT_TYPES.repositories.FindSprintRepository, useValue: mockFindSprintRepository },
      ],
    }).compile();

    service = module.get<FindSprintServiceImpl>(FindSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDeletedSprints', () => {
    it('should return deleted sprints', async () => {
      mockFindSprintRepository.findDeletedSprints.mockResolvedValue([{ id: 'sprint-1' }]);
      const result = await service.findDeletedSprints('ws-1', 'proj-1');
      expect(result).toEqual([{ id: 'sprint-1' }]);
    });
  });

  describe('findOneSprintForRestore', () => {
    it('should return sprint for restore', async () => {
      mockFindSprintRepository.findOneSprintForRestore.mockResolvedValue({ sprintId: 'sprint-1' });
      const result = await service.findOneSprintForRestore('ws-1', 'proj-1', 'sprint-1');
      expect(result).toEqual({ sprintId: 'sprint-1' });
    });
  });

  describe('findOneSprint', () => {
    it('should return null if sprint not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue(null);
      const result = await service.findOneSprint('sprint-1');
      expect(result).toBeNull();
    });

    it('should return sprint', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ id: 'sprint-1' });
      const result = await service.findOneSprint('sprint-1');
      expect(result).toEqual({ id: 'sprint-1' });
    });
  });

  describe('findAllSprintByProject', () => {
    it('should return sprints', async () => {
      mockFindSprintRepository.findAllSprintByProject.mockResolvedValue([{ id: 'sprint-1' }]);
      const result = await service.findAllSprintByProject('ws-1', 'proj-1');
      expect(result).toEqual([{ id: 'sprint-1' }]);
    });
  });

  describe('findTasksBySprint', () => {
    it('should return sprint with tasks', async () => {
      mockFindSprintRepository.findTasksBySprint.mockResolvedValue({ id: 'sprint-1' });
      const result = await service.findTasksBySprint('ws-1', 'proj-1', 'sprint-1');
      expect(result).toEqual({ id: 'sprint-1' });
    });
  });

  describe('getSprintProgress', () => {
    it('should return sprint progress', async () => {
      mockFindSprintRepository.getSprintProgress.mockResolvedValue({ totalTasks: 5 });
      const result = await service.getSprintProgress('ws-1', 'proj-1', 'sprint-1');
      expect(result).toEqual({ totalTasks: 5 });
    });
  });
});
