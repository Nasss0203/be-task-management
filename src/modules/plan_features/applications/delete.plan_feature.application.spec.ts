import { Test, TestingModule } from '@nestjs/testing';
import { DeletePlanFeatureApplicationImpl } from './delete.plan_feature.application';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('DeletePlanFeatureApplicationImpl', () => {
  let application: DeletePlanFeatureApplicationImpl;
  const mockService = { delete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePlanFeatureApplicationImpl,
        { provide: PLAN_FEATURE_TYPES.services.DeletePlanFeatureService, useValue: mockService },
      ],
    }).compile();

    application = module.get<DeletePlanFeatureApplicationImpl>(DeletePlanFeatureApplicationImpl);
  });

  it('should delete plan feature', async () => {
    mockService.delete.mockResolvedValue(undefined);
    await application.delete('1');
    expect(mockService.delete).toHaveBeenCalled();
  });
});
