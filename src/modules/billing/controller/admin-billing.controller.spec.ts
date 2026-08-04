import { Test, TestingModule } from '@nestjs/testing';
import { AdminBillingController } from './admin-billing.controller';
import { AdminBillingPlanService } from '../services/admin/admin-billing-plan.service';
import { AdminSubscriptionGrantService } from '../services/admin/admin-subscription-grant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from '../domain/entities/subscription.entity';
import { Payment } from '../domain/entities/payment.entity';

describe('AdminBillingController', () => {
  let controller: AdminBillingController;

  const mockPlanService = {
    getPlans: jest.fn(),
    createPlan: jest.fn(),
    updatePlan: jest.fn(),
    updatePlanStatus: jest.fn(),
  };

  const mockGrantService = {
    grant: jest.fn(),
    revoke: jest.fn(),
    cancel: jest.fn(),
    resume: jest.fn(),
  };

  const mockSubscriptionQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockSubscriptionRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockSubscriptionQueryBuilder),
  };

  const mockPaymentQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockPaymentRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockPaymentQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBillingController],
      providers: [
        { provide: AdminBillingPlanService, useValue: mockPlanService },
        { provide: AdminSubscriptionGrantService, useValue: mockGrantService },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepo,
        },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
      ],
    }).compile();

    controller = module.get<AdminBillingController>(AdminBillingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get plans', async () => {
    mockPlanService.getPlans.mockResolvedValue([{ id: 'plan-1' }]);
    const result = await controller.getPlans();
    expect(mockPlanService.getPlans).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'plan-1' }]);
  });

  it('should create plan', async () => {
    mockPlanService.createPlan.mockResolvedValue({ id: 'plan-1' });
    const result = await controller.createPlan({ name: 'Plan 1' } as any);
    expect(mockPlanService.createPlan).toHaveBeenCalledWith({ name: 'Plan 1' });
    expect(result).toEqual({ id: 'plan-1' });
  });

  it('should update plan', async () => {
    mockPlanService.updatePlan.mockResolvedValue({ id: 'plan-1' });
    const result = await controller.updatePlan('plan-1', {
      name: 'Plan 1',
    } as any);
    expect(mockPlanService.updatePlan).toHaveBeenCalledWith('plan-1', {
      name: 'Plan 1',
    });
    expect(result).toEqual({ id: 'plan-1' });
  });

  it('should update plan status', async () => {
    mockPlanService.updatePlanStatus.mockResolvedValue({ id: 'plan-1' });
    const result = await controller.updatePlanStatus('plan-1', {
      isActive: true,
    } as any);
    expect(mockPlanService.updatePlanStatus).toHaveBeenCalledWith('plan-1', {
      isActive: true,
    });
    expect(result).toEqual({ id: 'plan-1' });
  });

  it('should grant subscription', async () => {
    mockGrantService.grant.mockResolvedValue({ id: 'sub-1' });
    const result = await controller.grantSubscription({
      planId: 'plan-1',
    } as any);
    expect(mockGrantService.grant).toHaveBeenCalledWith({ planId: 'plan-1' });
    expect(result).toEqual({ id: 'sub-1' });
  });

  it('should revoke subscription', async () => {
    mockGrantService.revoke.mockResolvedValue({ id: 'sub-1' });
    const result = await controller.revokeSubscription({
      subscriptionId: 'sub-1',
    } as any);
    expect(mockGrantService.revoke).toHaveBeenCalledWith({
      subscriptionId: 'sub-1',
    });
    expect(result).toEqual({ id: 'sub-1' });
  });

  it('should cancel subscription', async () => {
    mockGrantService.cancel.mockResolvedValue({ id: 'sub-1' });
    const result = await controller.cancelSubscription('sub-1', {
      reason: 'reason',
    } as any);
    expect(mockGrantService.cancel).toHaveBeenCalledWith('sub-1', {
      reason: 'reason',
    });
    expect(result).toEqual({ id: 'sub-1' });
  });

  it('should resume subscription', async () => {
    mockGrantService.resume.mockResolvedValue({ id: 'sub-1' });
    const result = await controller.resumeSubscription('sub-1', {
      reason: 'reason',
    } as any);
    expect(mockGrantService.resume).toHaveBeenCalledWith('sub-1', {
      reason: 'reason',
    });
    expect(result).toEqual({ id: 'sub-1' });
  });

  it('should get subscriptions', async () => {
    mockSubscriptionQueryBuilder.getRawMany.mockResolvedValue([
      {
        id: 'sub-1',
        workspaceId: 'ws-1',
        userEmail: 'test@example.com',
        createdAt: new Date(),
      },
    ]);
    const result = await controller.getSubscriptions();
    expect(mockSubscriptionQueryBuilder.getRawMany).toHaveBeenCalled();
    expect(result[0].id).toEqual('sub-1');
    expect(result[0].rowId).toEqual('sub-1');
    expect(result[0].userEmail).toEqual('test@example.com');
  });

  it('should get payments', async () => {
    mockPaymentQueryBuilder.getRawMany.mockResolvedValue([
      {
        id: 'pay-1',
        amount: 100,
        orderCode: 'ORDER123',
        createdAt: new Date(),
      },
    ]);
    const result = await controller.getPayments();
    expect(mockPaymentQueryBuilder.getRawMany).toHaveBeenCalled();
    expect(result[0].id).toEqual('pay-1');
    expect(result[0].amount).toEqual(100);
    expect(result[0].invoiceNo).toEqual('ORDER123');
  });
});
