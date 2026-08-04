import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePlanFeatureApplicationImpl } from './update.plan_feature.application';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('UpdatePlanFeatureApplicationImpl', () => {
  let application: UpdatePlanFeatureApplicationImpl;
  const mockService = { update: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePlanFeatureApplicationImpl,
        {
          provide: PLAN_FEATURE_TYPES.services.UpdatePlanFeatureService,
          useValue: mockService,
        },
      ],
    }).compile();

    application = module.get<UpdatePlanFeatureApplicationImpl>(
      UpdatePlanFeatureApplicationImpl,
    );
  });

  it('should update plan feature', async () => {
    mockService.update.mockResolvedValue({ id: '1' });
    const result = await application.update('1', { limit: 10 });
    expect(mockService.update).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
