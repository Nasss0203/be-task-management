import { Test, TestingModule } from '@nestjs/testing';
import { GetSprintDetailApplicationImpl } from './get-sprint-detail.application';
import { SPRINT_TYPES } from '../interfaces/types';

describe('GetSprintDetailApplicationImpl', () => {
  let app: GetSprintDetailApplicationImpl;

  const mockGetSprintDetailService = { getSprintDetail: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSprintDetailApplicationImpl,
        {
          provide: SPRINT_TYPES.services.GetSprintDetailService,
          useValue: mockGetSprintDetailService,
        },
      ],
    }).compile();

    app = module.get<GetSprintDetailApplicationImpl>(
      GetSprintDetailApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('getSprintDetail', () => {
    it('should return mapped sprint detail', async () => {
      mockGetSprintDetailService.getSprintDetail.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await app.getSprintDetail({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      expect(result).toEqual({ id: 'sprint-1' });
      expect(mockGetSprintDetailService.getSprintDetail).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
    });
  });
});
