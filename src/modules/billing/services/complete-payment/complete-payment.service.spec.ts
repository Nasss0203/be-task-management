import { Test, TestingModule } from '@nestjs/testing';
import { CompletePaymentServiceImpl } from './complete-payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
import { Plan, PlanBillingInterval } from '../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';
import { Subscription } from '../../domain/entities/subscription.entity';
import { UsageLimit } from '../../domain/entities/usage-limit.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { NotFoundException } from '@nestjs/common';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

describe('CompletePaymentServiceImpl', () => {
  let service: CompletePaymentServiceImpl;

  const mockPaymentRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPlanRepo = {
    findOne: jest.fn(),
  };

  const mockSubscriptionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSubscriptionWorkspaceRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUsageLimitRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserWorkspaceQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockUserWorkspaceRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockUserWorkspaceQueryBuilder),
  };

  const mockWorkspaceRepo = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompletePaymentServiceImpl,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: getRepositoryToken(SubscriptionWorkspace), useValue: mockSubscriptionWorkspaceRepo },
        { provide: getRepositoryToken(UsageLimit), useValue: mockUsageLimitRepo },
        { provide: getRepositoryToken(UserWorkspace), useValue: mockUserWorkspaceRepo },
        { provide: getRepositoryToken(Workspace), useValue: mockWorkspaceRepo },
      ],
    }).compile();

    service = module.get<CompletePaymentServiceImpl>(CompletePaymentServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('complete', () => {
    it('should throw if payment not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.complete({ paymentId: 'pay-1' })).rejects.toThrow(NotFoundException);
    });

    it('should do nothing if payment is not succeeded', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.PENDING });
      await service.complete({ paymentId: 'pay-1' });
      expect(mockPlanRepo.findOne).not.toHaveBeenCalled();
    });

    it('should do nothing if payment already has subscription', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.SUCCEEDED, subscriptionId: 'sub-1' });
      await service.complete({ paymentId: 'pay-1' });
      expect(mockPlanRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw if plan not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.SUCCEEDED, planId: 'plan-1' });
      mockPlanRepo.findOne.mockResolvedValue(null);
      await expect(service.complete({ paymentId: 'pay-1' })).rejects.toThrow(NotFoundException);
    });

    it('should complete payment and create new subscription', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.SUCCEEDED, planId: 'plan-1', userId: 'u-1', orderCode: 'ORD' });
      mockPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', billingInterval: PlanBillingInterval.MONTH, limits: { upgradedWorkspaces: 1 } });
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      mockSubscriptionRepo.create.mockReturnValue({ id: 'sub-new' });
      mockSubscriptionRepo.save.mockResolvedValue({ id: 'sub-new' });
      
      mockUserWorkspaceQueryBuilder.getRawMany.mockResolvedValue([{ workspaceId: 'ws-1' }]);
      mockSubscriptionWorkspaceRepo.count.mockResolvedValue(0);
      mockSubscriptionWorkspaceRepo.findOne.mockResolvedValue(null);
      mockSubscriptionWorkspaceRepo.create.mockReturnValue({ id: 'sw-1' });

      mockUsageLimitRepo.findOne.mockResolvedValue(null);
      mockUsageLimitRepo.create.mockReturnValue({ id: 'ul-1' });

      await service.complete({ paymentId: 'pay-1' });
      
      expect(mockSubscriptionRepo.create).toHaveBeenCalled();
      expect(mockSubscriptionRepo.save).toHaveBeenCalled();
      expect(mockSubscriptionWorkspaceRepo.create).toHaveBeenCalled();
      expect(mockSubscriptionWorkspaceRepo.save).toHaveBeenCalled();
      expect(mockWorkspaceRepo.update).toHaveBeenCalledWith(
        { id: 'ws-1' },
        { planType: 'pro' },
      );
      expect(mockPaymentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 'sub-new' }));
    });
  });
});
