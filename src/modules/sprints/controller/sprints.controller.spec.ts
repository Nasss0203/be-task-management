import { Test, TestingModule } from '@nestjs/testing';
import { SprintsController } from './sprints.controller';
import { SPRINT_TYPES } from '../interfaces/types';

describe('SprintsController', () => {
  let controller: SprintsController;

  const mockCreateSprintApplication = { create: jest.fn() };
  const mockFindSprintApplication = {
    findAllSprintByProject: jest.fn(),
    findTasksBySprint: jest.fn(),
    getSprintProgress: jest.fn(),
  };
  const mockStartSprintApplication = { start: jest.fn() };
  const mockCompleteSprintApplication = { complete: jest.fn() };
  const mockCancelSprintApplication = { cancelSprint: jest.fn() };
  const mockUpdateSprintApplication = { updateSprint: jest.fn() };
  const mockGetSprintDetailApplication = { getSprintDetail: jest.fn() };
  const mockDeleteSprintApplication = { delete: jest.fn(), restore: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SprintsController],
      providers: [
        {
          provide: SPRINT_TYPES.applications.CreateSprintApplication,
          useValue: mockCreateSprintApplication,
        },
        {
          provide: SPRINT_TYPES.applications.FindSprintApplication,
          useValue: mockFindSprintApplication,
        },
        {
          provide: SPRINT_TYPES.applications.StartSprintApplication,
          useValue: mockStartSprintApplication,
        },
        {
          provide: SPRINT_TYPES.applications.CompleteSprintApplication,
          useValue: mockCompleteSprintApplication,
        },
        {
          provide: SPRINT_TYPES.applications.CancelSprintApplication,
          useValue: mockCancelSprintApplication,
        },
        {
          provide: SPRINT_TYPES.applications.UpdateSprintApplication,
          useValue: mockUpdateSprintApplication,
        },
        {
          provide: SPRINT_TYPES.applications.GetSprintDetailApplication,
          useValue: mockGetSprintDetailApplication,
        },
        {
          provide: SPRINT_TYPES.applications.DeleteSprintApplication,
          useValue: mockDeleteSprintApplication,
        },
      ],
    }).compile();

    controller = module.get<SprintsController>(SprintsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call create application', async () => {
      mockCreateSprintApplication.create.mockResolvedValue({ id: 'sprint-1' });
      const result = await controller.create(
        'ws-1',
        'proj-1',
        {} as any,
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockCreateSprintApplication.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        userId: 'user-1',
        dto: {},
      });
    });
  });

  describe('findAllSprintByProject', () => {
    it('should call findAllSprintByProject application', async () => {
      mockFindSprintApplication.findAllSprintByProject.mockResolvedValue([
        { id: 'sprint-1' },
      ]);
      const result = await controller.findAllSprintByProject(
        'ws-1',
        'proj-1',
        { keyword: 'test' } as any,
        { id: 'user-1' } as any,
      );
      expect(result).toEqual([{ id: 'sprint-1' }]);
      expect(
        mockFindSprintApplication.findAllSprintByProject,
      ).toHaveBeenCalled();
    });
  });

  describe('findTasksBySprint', () => {
    it('should call findTasksBySprint application', async () => {
      mockFindSprintApplication.findTasksBySprint.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await controller.findTasksBySprint(
        'ws-1',
        'proj-1',
        'sprint-1',
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockFindSprintApplication.findTasksBySprint).toHaveBeenCalled();
    });
  });

  describe('getSprintDetail', () => {
    it('should call getSprintDetail application', async () => {
      mockGetSprintDetailApplication.getSprintDetail.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await controller.getSprintDetail(
        'ws-1',
        'proj-1',
        'sprint-1',
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockGetSprintDetailApplication.getSprintDetail).toHaveBeenCalled();
    });
  });

  describe('startSprint', () => {
    it('should call start application', async () => {
      mockStartSprintApplication.start.mockResolvedValue({ id: 'sprint-1' });
      const result = await controller.startSprint(
        'ws-1',
        'proj-1',
        'sprint-1',
        {} as any,
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockStartSprintApplication.start).toHaveBeenCalled();
    });
  });

  describe('completeSprint', () => {
    it('should call complete application', async () => {
      mockCompleteSprintApplication.complete.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await controller.completeSprint(
        'ws-1',
        'proj-1',
        'sprint-1',
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockCompleteSprintApplication.complete).toHaveBeenCalled();
    });
  });

  describe('cancelSprint', () => {
    it('should call cancelSprint application', async () => {
      mockCancelSprintApplication.cancelSprint.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await controller.cancelSprint(
        'ws-1',
        'proj-1',
        'sprint-1',
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockCancelSprintApplication.cancelSprint).toHaveBeenCalled();
    });
  });

  describe('updateSprint', () => {
    it('should call updateSprint application', async () => {
      mockUpdateSprintApplication.updateSprint.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await controller.updateSprint(
        'ws-1',
        'proj-1',
        'sprint-1',
        {} as any,
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockUpdateSprintApplication.updateSprint).toHaveBeenCalled();
    });
  });

  describe('getSprintProgress', () => {
    it('should call getSprintProgress application', async () => {
      mockFindSprintApplication.getSprintProgress.mockResolvedValue({
        progress: 50,
      });
      const result = await controller.getSprintProgress(
        'ws-1',
        'proj-1',
        'sprint-1',
        { id: 'user-1' } as any,
      );
      expect(result).toEqual({ progress: 50 });
      expect(mockFindSprintApplication.getSprintProgress).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call delete application', async () => {
      mockDeleteSprintApplication.delete.mockResolvedValue(undefined);
      const result = await controller.deleteSprint(
        'ws-1',
        'proj-1',
        'sprint-1',
        { id: 'user-1' } as any,
      );
      expect(result).toBeUndefined();
      expect(mockDeleteSprintApplication.delete).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      });
    });
  });
});
