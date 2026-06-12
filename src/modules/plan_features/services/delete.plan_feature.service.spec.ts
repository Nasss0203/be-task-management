import { Test, TestingModule } from '@nestjs/testing';
import { DeletePlanFeatureServiceImpl } from './delete.plan_feature.service';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('DeletePlanFeatureServiceImpl', () => {
  let service: DeletePlanFeatureServiceImpl;
  const mockFindService = { findById: jest.fn() };
  const mockRepo = { softDelete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePlanFeatureServiceImpl,
        { provide: PLAN_FEATURE_TYPES.services.FindPlanFeatureService, useValue: mockFindService },
        { provide: PLAN_FEATURE_TYPES.repositories.DeletePlanFeatureRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DeletePlanFeatureServiceImpl>(DeletePlanFeatureServiceImpl);
  });

  it('should delete plan feature', async () => {
    mockFindService.findById.mockResolvedValue({ id: '1' });
    mockRepo.softDelete.mockResolvedValue(true);
    await service.delete('1');
    expect(mockFindService.findById).toHaveBeenCalledWith('1', undefined);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('1', undefined);
  });
});
