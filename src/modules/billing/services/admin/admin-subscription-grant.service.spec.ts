import { Test, TestingModule } from '@nestjs/testing';
import { AdminSubscriptionGrantService } from './admin-subscription-grant.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '../../domain/entities/subscription.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Plan } from '../../domain/entities/plan.entity';
import { FREE_PLAN_SLUG } from '../../constants/default-plan-limits.constant';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';

describe('AdminSubscriptionGrantService', () => {
  let service: AdminSubscriptionGrantService;

  const mockManager = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((_, data) => data),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'saved-id', ...data })),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSubscriptionGrantService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AdminSubscriptionGrantService>(AdminSubscriptionGrantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('grant', () => {
    it('should throw if workspace not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.grant({ workspaceId: 'ws-1', planId: 'plan-1' })).rejects.toThrow(NotFoundException);
    });

    it('should grant subscription', async () => {
      mockManager.findOne.mockImplementation((entity) => {
        if (entity === Workspace) return Promise.resolve({ id: 'ws-1' });
        if (entity === Plan) return Promise.resolve({ id: 'plan-1', slug: 'pro-monthly', billingInterval: 'month' });
        return Promise.resolve(null);
      });
      
      const mockOwnerQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ ownerId: 'u-1' }),
      };
      mockManager.createQueryBuilder.mockReturnValue(mockOwnerQueryBuilder);

      const result = await service.grant({ workspaceId: 'ws-1', planId: 'plan-1' });
      expect(result.workspaceId).toEqual('ws-1');
      expect(result.ownerId).toEqual('u-1');
      expect(result.planId).toEqual('plan-1');
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should throw if subscription not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.cancel('sub-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should cancel subscription at period end', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'sub-1', status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date() });
      const result = await service.cancel('sub-1', { immediate: false });
      expect(result.cancelAtPeriodEnd).toEqual(true);
      expect(result.status).toEqual(SubscriptionStatus.ACTIVE);
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should cancel subscription immediately', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'sub-1', status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date() });
      mockManager.find.mockResolvedValueOnce([]); // subscriptionWorkspaces
      const result = await service.cancel('sub-1', { immediate: true });
      expect(result.cancelAtPeriodEnd).toEqual(false);
      expect(result.status).toEqual(SubscriptionStatus.CANCELLED);
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('should throw if subscription not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.resume('sub-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw if subscription is not cancelled', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'sub-1', status: SubscriptionStatus.ACTIVE, cancelAtPeriodEnd: false });
      await expect(service.resume('sub-1', {})).rejects.toThrow(BadRequestException);
    });

    it('should resume subscription', async () => {
      mockManager.findOne.mockImplementation((entity) => {
        if (entity === Subscription) return Promise.resolve({ id: 'sub-1', status: SubscriptionStatus.CANCELLED, metadata: { affectedWorkspaceIds: [] } });
        if (entity === Plan) return Promise.resolve({ id: 'plan-1' });
        return Promise.resolve(null);
      });
      const result = await service.resume('sub-1', {});
      expect(result.resumed).toEqual(true);
      expect(result.status).toEqual(SubscriptionStatus.ACTIVE);
      expect(result.cancelAtPeriodEnd).toEqual(false);
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should revoke subscription', async () => {
      mockManager.findOne.mockImplementation((entity) => {
        if (entity === Workspace) return Promise.resolve({ id: 'ws-1' });
        if (entity === SubscriptionWorkspace) return Promise.resolve({ workspaceId: 'ws-1', subscriptionId: 'sub-1' });
        if (entity === Subscription) return Promise.resolve({ id: 'sub-1' });
        if (entity === Plan) return Promise.resolve({ id: 'free-1', slug: FREE_PLAN_SLUG });
        return Promise.resolve(null);
      });
      
      const result = await service.revoke({ workspaceId: 'ws-1' });
      expect(result.revoked).toEqual(true);
      expect(result.workspaceId).toEqual('ws-1');
      expect(result.subscriptionId).toEqual('sub-1');
      expect(mockManager.remove).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled(); // saves workspace as free plan
    });
  });
});
