import { Test, TestingModule } from '@nestjs/testing';
import { BillingQueryServiceImpl } from './billing-query.service';
import { BILLING_TYPES } from '../../interfaces/types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlanMapper } from '../../mapper/plan.mapper';
import { FREE_PLAN_SLUG } from '../../constants/default-plan-limits.constant';

describe('BillingQueryServiceImpl', () => {
  let service: BillingQueryServiceImpl;

  const mockRepo = {
    findActivePlans: jest.fn(),
    findActivePlanById: jest.fn(),
    findActiveSubscription: jest.fn(),
    findPlanById: jest.fn(),
    countSubscriptionWorkspaces: jest.fn(),
    existsWorkspaceMember: jest.fn(),
    findUsageLimitsByWorkspaceId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingQueryServiceImpl,
        { provide: BILLING_TYPES.repositories.BillingQueryRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<BillingQueryServiceImpl>(BillingQueryServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('should get plans', async () => {
      mockRepo.findActivePlans.mockResolvedValue([{ id: 'plan-1' }]);
      jest.spyOn(PlanMapper, 'toModel').mockReturnValue({ id: 'plan-1' } as any);
      jest.spyOn(PlanMapper, 'toResponseList').mockReturnValue([{ id: 'plan-1' }] as any);
      const result = await service.getPlans();
      expect(mockRepo.findActivePlans).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'plan-1' }]);
    });
  });

  describe('getPlanById', () => {
    it('should throw if plan not found', async () => {
      mockRepo.findActivePlanById.mockResolvedValue(null);
      await expect(service.getPlanById('plan-1')).rejects.toThrow(NotFoundException);
    });

    it('should get plan by id', async () => {
      mockRepo.findActivePlanById.mockResolvedValue({ id: 'plan-1' });
      jest.spyOn(PlanMapper, 'toModel').mockReturnValue({ id: 'plan-1' } as any);
      jest.spyOn(PlanMapper, 'toResponse').mockReturnValue({ id: 'plan-1' } as any);
      const result = await service.getPlanById('plan-1');
      expect(mockRepo.findActivePlanById).toHaveBeenCalledWith('plan-1');
      expect(result).toEqual({ id: 'plan-1' });
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return free plan if no active subscription', async () => {
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      const result = await service.getCurrentSubscription('u-1');
      expect(result.plan.slug).toEqual(FREE_PLAN_SLUG);
      expect(result.subscription).toBeNull();
    });

    it('should return current subscription', async () => {
      mockRepo.findActiveSubscription.mockResolvedValue({ id: 'sub-1', planId: 'plan-1', status: 'ACTIVE' });
      mockRepo.findPlanById.mockResolvedValue({ id: 'plan-1', slug: 'pro-monthly', limits: { upgradedWorkspaces: 15 } });
      mockRepo.countSubscriptionWorkspaces.mockResolvedValue(2);
      
      const result = await service.getCurrentSubscription('u-1');
      expect(result.plan?.id).toEqual('plan-1');
      expect(result.subscription?.id).toEqual('sub-1');
      expect(result.upgradedWorkspace.used).toEqual(2);
      expect(result.upgradedWorkspace.limit).toEqual(15);
    });
  });

  describe('getWorkspaceUsageLimits', () => {
    it('should throw if user has no access to workspace', async () => {
      mockRepo.existsWorkspaceMember.mockResolvedValue(false);
      await expect(service.getWorkspaceUsageLimits('u-1', 'ws-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return workspace usage limits', async () => {
      mockRepo.existsWorkspaceMember.mockResolvedValue(true);
      mockRepo.findUsageLimitsByWorkspaceId.mockResolvedValue([
        { id: 'ul-1', workspaceId: 'ws-1', resourceType: 'projects', limitValue: 5, usedValue: 2 },
        { id: 'ul-2', workspaceId: 'ws-1', resourceType: 'users', limitValue: null, usedValue: 2 },
      ]);
      const result = await service.getWorkspaceUsageLimits('u-1', 'ws-1');
      expect(result.length).toEqual(2);
      expect(result[0].remaining).toEqual(3);
      expect(result[1].remaining).toBeNull();
    });
  });
});
