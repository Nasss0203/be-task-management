import { Test, TestingModule } from '@nestjs/testing';
import { PlanController } from './plan.controller';
import { BILLING_TYPES } from '../interfaces/types';

describe('PlanController', () => {
  let controller: PlanController;

  const mockQueryApp = {
    getPlans: jest.fn(),
    getPlanById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        { provide: BILLING_TYPES.applications.BillingQueryApplication, useValue: mockQueryApp },
      ],
    }).compile();

    controller = module.get<PlanController>(PlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get plans', async () => {
    mockQueryApp.getPlans.mockResolvedValue([{ id: 'plan-1' }]);
    const result = await controller.getPlans();
    expect(mockQueryApp.getPlans).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'plan-1' }]);
  });

  it('should get plan by id', async () => {
    mockQueryApp.getPlanById.mockResolvedValue({ id: 'plan-1' });
    const result = await controller.getPlanById('plan-1');
    expect(mockQueryApp.getPlanById).toHaveBeenCalledWith('plan-1');
    expect(result).toEqual({ id: 'plan-1' });
  });
});
