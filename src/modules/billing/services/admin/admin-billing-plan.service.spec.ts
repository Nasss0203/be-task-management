import { Test, TestingModule } from '@nestjs/testing';
import { AdminBillingPlanService } from './admin-billing-plan.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from '../../domain/entities/plan.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AdminBillingPlanService', () => {
  let service: AdminBillingPlanService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  const mockRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBillingPlanService,
        { provide: getRepositoryToken(Plan), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AdminBillingPlanService>(AdminBillingPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('should get plans', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { id: 'plan-1', priceAmount: 120000, billingInterval: 'YEAR', activeSubscriptions: '5' },
      ]);
      const result = await service.getPlans();
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
      expect(result[0].id).toEqual('plan-1');
      expect(result[0].monthlyAmount).toEqual(10000); // 120000 / 12
      expect(result[0].estimatedMrr).toEqual(50000); // 10000 * 5
    });
  });

  describe('createPlan', () => {
    it('should throw if slug already exists', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'existing-plan' });
      await expect(service.createPlan({ slug: 'test' } as any)).rejects.toThrow(ConflictException);
    });

    it('should create plan', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ id: 'plan-1' });
      mockRepo.save.mockResolvedValue({ id: 'plan-1' });
      mockQueryBuilder.getRawOne.mockResolvedValue({ id: 'plan-1', priceAmount: 100000, billingInterval: 'MONTH', activeSubscriptions: '0' });

      const result = await service.createPlan({ name: 'Plan 1', slug: 'plan-1', priceAmount: 100000, billingInterval: 'MONTH' as any });
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.id).toEqual('plan-1');
    });
  });

  describe('updatePlan', () => {
    it('should throw if plan not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updatePlan('plan-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw if new slug exists', async () => {
      mockRepo.findOne.mockImplementation(({ where }) => {
        if (where.id === 'plan-1') return Promise.resolve({ id: 'plan-1', slug: 'old-slug' });
        if (where.slug === 'new-slug') return Promise.resolve({ id: 'plan-2', slug: 'new-slug' });
        return Promise.resolve(null);
      });
      await expect(service.updatePlan('plan-1', { slug: 'new-slug' })).rejects.toThrow(ConflictException);
    });

    it('should update plan', async () => {
      mockRepo.findOne.mockImplementation(({ where }) => {
        if (where.id === 'plan-1') return Promise.resolve({ id: 'plan-1', slug: 'old-slug' });
        return Promise.resolve(null);
      });
      mockRepo.save.mockResolvedValue({ id: 'plan-1' });
      mockQueryBuilder.getRawOne.mockResolvedValue({ id: 'plan-1', slug: 'new-slug', priceAmount: 100000, billingInterval: 'MONTH', activeSubscriptions: '0' });

      const result = await service.updatePlan('plan-1', { slug: 'new-slug', name: 'New Name' });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.slug).toEqual('new-slug');
    });
  });

  describe('updatePlanStatus', () => {
    it('should update plan status', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'plan-1', isActive: false });
      mockRepo.save.mockResolvedValue({ id: 'plan-1', isActive: true });
      mockQueryBuilder.getRawOne.mockResolvedValue({ id: 'plan-1', isActive: true, priceAmount: 100000, billingInterval: 'MONTH', activeSubscriptions: '0' });

      const result = await service.updatePlanStatus('plan-1', { isActive: true });
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
      expect(result.isActive).toEqual(true);
    });
  });
});
