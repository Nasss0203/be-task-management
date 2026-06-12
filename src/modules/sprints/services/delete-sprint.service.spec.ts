import { Test, TestingModule } from '@nestjs/testing';
import { DeleteSprintServiceImpl } from './delete-sprint.service';
import { SPRINT_TYPES } from '../interfaces/types';

describe('DeleteSprintServiceImpl', () => {
  let service: DeleteSprintServiceImpl;

  const mockDeleteSprintRepository = { softDeleteSprint: jest.fn(), restoreSprint: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSprintServiceImpl,
        { provide: SPRINT_TYPES.repositories.DeleteSprintRepository, useValue: mockDeleteSprintRepository },
      ],
    }).compile();

    service = module.get<DeleteSprintServiceImpl>(DeleteSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDeleteSprint', () => {
    it('should call softDeleteSprint', async () => {
      mockDeleteSprintRepository.softDeleteSprint.mockResolvedValue(undefined);
      await service.softDeleteSprint({ sprintId: 'sprint-1', deletedBy: 'user-1' });
      expect(mockDeleteSprintRepository.softDeleteSprint).toHaveBeenCalledWith({ sprintId: 'sprint-1', deletedBy: 'user-1' }, undefined);
    });
  });

  describe('restoreSprint', () => {
    it('should call restoreSprint', async () => {
      mockDeleteSprintRepository.restoreSprint.mockResolvedValue(undefined);
      await service.restoreSprint({ sprintId: 'sprint-1' });
      expect(mockDeleteSprintRepository.restoreSprint).toHaveBeenCalledWith({ sprintId: 'sprint-1' }, undefined);
    });
  });
});
