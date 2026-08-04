import { Test, TestingModule } from '@nestjs/testing';
import { BillingQueryApplicationImpl } from './billing-query.application';
import { BILLING_TYPES } from '../interfaces/types';

describe('BillingQueryApplicationImpl', () => {
  let app: BillingQueryApplicationImpl;

  const mockService = {
    getPlans: jest.fn(),
    getPlanById: jest.fn(),
    getCurrentSubscription: jest.fn(),
    getWorkspaceUsageLimits: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingQueryApplicationImpl,
        {
          provide: BILLING_TYPES.services.BillingQueryService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<BillingQueryApplicationImpl>(BillingQueryApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should get plans', async () => {
    mockService.getPlans.mockResolvedValue([{ id: 'plan-1' }]);
    const result = await app.getPlans();
    expect(mockService.getPlans).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'plan-1' }]);
  });

  it('should get plan by id', async () => {
    mockService.getPlanById.mockResolvedValue({ id: 'plan-1' });
    const result = await app.getPlanById('plan-1');
    expect(mockService.getPlanById).toHaveBeenCalledWith('plan-1');
    expect(result).toEqual({ id: 'plan-1' });
  });

  it('should get current subscription', async () => {
    mockService.getCurrentSubscription.mockResolvedValue({ id: 'sub-1' });
    const result = await app.getCurrentSubscription('u-1');
    expect(mockService.getCurrentSubscription).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'sub-1' });
  });

  it('should get workspace usage limits', async () => {
    mockService.getWorkspaceUsageLimits.mockResolvedValue([{ id: 'limit-1' }]);
    const result = await app.getWorkspaceUsageLimits('u-1', 'ws-1');
    expect(mockService.getWorkspaceUsageLimits).toHaveBeenCalledWith(
      'u-1',
      'ws-1',
    );
    expect(result).toEqual([{ id: 'limit-1' }]);
  });
});
