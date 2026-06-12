import { Test, TestingModule } from '@nestjs/testing';
import { PlanFeaturesController } from './plan_features.controller';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

describe('PlanFeaturesController', () => {
  let controller: PlanFeaturesController;
  const mockCreate = { create: jest.fn() };
  const mockFind = { findAll: jest.fn(), findById: jest.fn() };
  const mockUpdate = { update: jest.fn() };
  const mockDelete = { delete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanFeaturesController],
      providers: [
        { provide: PLAN_FEATURE_TYPES.applications.CreatePlanFeatureApplication, useValue: mockCreate },
        { provide: PLAN_FEATURE_TYPES.applications.FindPlanFeatureApplication, useValue: mockFind },
        { provide: PLAN_FEATURE_TYPES.applications.UpdatePlanFeatureApplication, useValue: mockUpdate },
        { provide: PLAN_FEATURE_TYPES.applications.DeletePlanFeatureApplication, useValue: mockDelete },
      ],
    }).compile();

    controller = module.get<PlanFeaturesController>(PlanFeaturesController);
  });

  it('should create plan feature', async () => {
    mockCreate.create.mockResolvedValue({ id: '1' });
    const result = await controller.create({ planId: 'p1', featureId: 'f1' });
    expect(mockCreate.create).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should find plan features', async () => {
    mockFind.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await controller.findAll();
    expect(mockFind.findAll).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should find plan feature by id', async () => {
    mockFind.findById.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1');
    expect(mockFind.findById).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should update plan feature', async () => {
    mockUpdate.update.mockResolvedValue({ id: '1' });
    const result = await controller.update('1', { limit: 10 });
    expect(mockUpdate.update).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should delete plan feature', async () => {
    mockDelete.delete.mockResolvedValue(true);
    const result = await controller.remove('1');
    expect(mockDelete.delete).toHaveBeenCalled();
    expect(result.success).toEqual(true);
  });
});
