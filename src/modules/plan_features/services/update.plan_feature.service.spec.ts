import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePlanFeatureServiceImpl } from './update.plan_feature.service';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('UpdatePlanFeatureServiceImpl', () => {
  let service: UpdatePlanFeatureServiceImpl;
  const mockFindService = { findById: jest.fn() };
  const mockRepo = { save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePlanFeatureServiceImpl,
        {
          provide: PLAN_FEATURE_TYPES.services.FindPlanFeatureService,
          useValue: mockFindService,
        },
        {
          provide: PLAN_FEATURE_TYPES.repositories.UpdatePlanFeatureRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UpdatePlanFeatureServiceImpl>(
      UpdatePlanFeatureServiceImpl,
    );
  });

  it('should update plan feature', async () => {
    mockFindService.findById.mockResolvedValue({ id: '1' });
    mockRepo.save.mockResolvedValue({ id: '1', limit: 10 });
    const result = await service.update('1', { limit: 10 });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.limit).toEqual(10);
  });
});
