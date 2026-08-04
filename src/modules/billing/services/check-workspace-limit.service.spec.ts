import { Test, TestingModule } from '@nestjs/testing';
import { CheckWorkspaceLimitServiceImpl } from './check-workspace-limit.service';
import { BILLING_TYPES } from '../interfaces/types';
import { BadRequestException } from '@nestjs/common';
import {
  FREE_PLAN_SLUG,
  PRO_PLAN_SLUG,
} from '../constants/default-plan-limits.constant';

describe('CheckWorkspaceLimitServiceImpl', () => {
  let service: CheckWorkspaceLimitServiceImpl;

  const mockRepo = {
    countActiveWorkspacesByUserId: jest.fn(),
    findActiveSubscription: jest.fn(),
    findActivePlanById: jest.fn(),
    findActivePlanBySlug: jest.fn(),
    countSubscriptionWorkspaces: jest.fn(),
    findSubscriptionWorkspaceByWorkspaceId: jest.fn(),
    saveSubscriptionWorkspace: jest.fn(),
    createSubscriptionWorkspace: jest.fn(),
    findUsageLimit: jest.fn(),
    saveUsageLimit: jest.fn(),
    createUsageLimit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckWorkspaceLimitServiceImpl,
        {
          provide: BILLING_TYPES.repositories.WorkspaceLimitRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CheckWorkspaceLimitServiceImpl>(
      CheckWorkspaceLimitServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkCanCreateWorkspace', () => {
    it('should throw if free plan limit exceeded', async () => {
      mockRepo.countActiveWorkspacesByUserId.mockResolvedValue(5);
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      await expect(service.checkCanCreateWorkspace('u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass if free plan limit not exceeded', async () => {
      mockRepo.countActiveWorkspacesByUserId.mockResolvedValue(3);
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      await expect(
        service.checkCanCreateWorkspace('u-1'),
      ).resolves.toBeUndefined();
    });

    it('should throw if plan limit exceeded', async () => {
      mockRepo.countActiveWorkspacesByUserId.mockResolvedValue(10);
      mockRepo.findActiveSubscription.mockResolvedValue({ planId: 'plan-1' });
      mockRepo.findActivePlanById.mockResolvedValue({
        slug: PRO_PLAN_SLUG,
        limits: { workspaces: 10 },
      });
      await expect(service.checkCanCreateWorkspace('u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass if plan limit not exceeded', async () => {
      mockRepo.countActiveWorkspacesByUserId.mockResolvedValue(8);
      mockRepo.findActiveSubscription.mockResolvedValue({ planId: 'plan-1' });
      mockRepo.findActivePlanById.mockResolvedValue({
        slug: PRO_PLAN_SLUG,
        limits: { workspaces: 10 },
      });
      await expect(
        service.checkCanCreateWorkspace('u-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('applyBillingForNewWorkspace', () => {
    it('should apply free usage limit if no active subscription', async () => {
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.findActivePlanBySlug.mockResolvedValue({
        id: 'free-1',
        slug: FREE_PLAN_SLUG,
        limits: {},
      });
      mockRepo.findUsageLimit.mockResolvedValue(null);
      mockRepo.createUsageLimit.mockReturnValue({ id: 'new-ul' });
      await service.applyBillingForNewWorkspace('u-1', 'ws-1');
      expect(mockRepo.saveUsageLimit).toHaveBeenCalled();
    });

    it('should apply free usage limit if plan is not pro', async () => {
      mockRepo.findActiveSubscription.mockResolvedValue({ planId: 'plan-1' });
      mockRepo.findActivePlanById.mockResolvedValue({ slug: FREE_PLAN_SLUG });
      mockRepo.findActivePlanBySlug.mockResolvedValue({
        id: 'free-1',
        slug: FREE_PLAN_SLUG,
        limits: {},
      });
      mockRepo.findUsageLimit.mockResolvedValue(null);
      mockRepo.createUsageLimit.mockReturnValue({ id: 'new-ul' });
      await service.applyBillingForNewWorkspace('u-1', 'ws-1');
      expect(mockRepo.saveUsageLimit).toHaveBeenCalled();
    });
  });
});
