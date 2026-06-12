import { Test, TestingModule } from '@nestjs/testing';
import { FindPlanFeatureServiceImpl } from './find.plan_feature.service';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('FindPlanFeatureServiceImpl', () => {
  let service: FindPlanFeatureServiceImpl;
  const mockRepo = { findAll: jest.fn(), findById: jest.fn(), findByPlanAndFeature: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPlanFeatureServiceImpl,
        { provide: PLAN_FEATURE_TYPES.repositories.FindPlanFeatureRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FindPlanFeatureServiceImpl>(FindPlanFeatureServiceImpl);
  });

  it('should find plan features', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(mockRepo.findAll).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should find plan feature by id', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1' });
    const result = await service.findById('1');
    expect(mockRepo.findById).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should fail if plan feature by id not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('1')).rejects.toThrow(NotFoundException);
  });

  it('should find plan feature by plan and feature', async () => {
    mockRepo.findByPlanAndFeature.mockResolvedValue({ id: '1' });
    const result = await service.findByPlanAndFeature('p1', 'f1');
    expect(mockRepo.findByPlanAndFeature).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should fail if plan feature by plan and feature not found', async () => {
    mockRepo.findByPlanAndFeature.mockResolvedValue(null);
    await expect(service.findByPlanAndFeature('p1', 'f1')).rejects.toThrow(NotFoundException);
  });
});
