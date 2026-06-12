import { Test, TestingModule } from '@nestjs/testing';
import { FindPlanFeatureApplicationImpl } from './find.plan_feature.application';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('FindPlanFeatureApplicationImpl', () => {
  let application: FindPlanFeatureApplicationImpl;
  const mockService = { findAll: jest.fn(), findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPlanFeatureApplicationImpl,
        { provide: PLAN_FEATURE_TYPES.services.FindPlanFeatureService, useValue: mockService },
      ],
    }).compile();

    application = module.get<FindPlanFeatureApplicationImpl>(FindPlanFeatureApplicationImpl);
  });

  it('should find plan features', async () => {
    mockService.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await application.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should find by id', async () => {
    mockService.findById.mockResolvedValue({ id: '1' });
    const result = await application.findById('1');
    expect(mockService.findById).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
