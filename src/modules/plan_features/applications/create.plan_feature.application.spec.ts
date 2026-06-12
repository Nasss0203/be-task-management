import { Test, TestingModule } from '@nestjs/testing';
import { CreatePlanFeatureApplicationImpl } from './create.plan_feature.application';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('CreatePlanFeatureApplicationImpl', () => {
  let application: CreatePlanFeatureApplicationImpl;
  const mockService = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePlanFeatureApplicationImpl,
        { provide: PLAN_FEATURE_TYPES.services.CreatePlanFeatureService, useValue: mockService },
      ],
    }).compile();

    application = module.get<CreatePlanFeatureApplicationImpl>(CreatePlanFeatureApplicationImpl);
  });

  it('should create plan feature', async () => {
    mockService.create.mockResolvedValue({ id: '1' });
    const result = await application.create({ planId: 'p1', featureId: 'f1' });
    expect(mockService.create).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
