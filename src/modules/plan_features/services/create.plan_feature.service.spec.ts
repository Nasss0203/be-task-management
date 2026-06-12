import { Test, TestingModule } from '@nestjs/testing';
import { CreatePlanFeatureServiceImpl } from './create.plan_feature.service';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('CreatePlanFeatureServiceImpl', () => {
  let service: CreatePlanFeatureServiceImpl;
  const mockRepo = { save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePlanFeatureServiceImpl,
        { provide: PLAN_FEATURE_TYPES.repositories.CreatePlanFeatureRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreatePlanFeatureServiceImpl>(CreatePlanFeatureServiceImpl);
  });

  it('should create plan feature', async () => {
    mockRepo.save.mockResolvedValue({ id: '1' });
    const result = await service.create({ planId: 'p1', featureId: 'f1' });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
