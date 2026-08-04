import { Test, TestingModule } from '@nestjs/testing';
import { UsageLimitEnforcerServiceImpl } from './usage-limit-enforcer.service';
import { BILLING_TYPES } from '../../interfaces/types';
import { BadRequestException } from '@nestjs/common';
import { UsageResourceType } from '../../domain/entities/usage-limit.entity';

describe('UsageLimitEnforcerServiceImpl', () => {
  let service: UsageLimitEnforcerServiceImpl;

  const mockRepo = {
    findByWorkspaceAndResource: jest.fn(),
    countProjectsByWorkspaceId: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageLimitEnforcerServiceImpl,
        {
          provide: BILLING_TYPES.repositories.UsageLimitRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsageLimitEnforcerServiceImpl>(
      UsageLimitEnforcerServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkProjectLimit', () => {
    it('should throw if limit not found', async () => {
      mockRepo.findByWorkspaceAndResource.mockResolvedValue(null);
      await expect(service.checkProjectLimit('ws-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass if limit is unlimited', async () => {
      mockRepo.findByWorkspaceAndResource.mockResolvedValue({
        limitValue: null,
      });
      await expect(service.checkProjectLimit('ws-1')).resolves.toBeUndefined();
    });

    it('should throw if project limit reached', async () => {
      mockRepo.findByWorkspaceAndResource.mockResolvedValue({ limitValue: 5 });
      mockRepo.countProjectsByWorkspaceId.mockResolvedValue(5);
      await expect(service.checkProjectLimit('ws-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass if project limit not reached', async () => {
      mockRepo.findByWorkspaceAndResource.mockResolvedValue({ limitValue: 5 });
      mockRepo.countProjectsByWorkspaceId.mockResolvedValue(3);
      await expect(service.checkProjectLimit('ws-1')).resolves.toBeUndefined();
    });
  });

  describe('syncProjectUsedValue', () => {
    it('should do nothing if limit not found', async () => {
      mockRepo.findByWorkspaceAndResource.mockResolvedValue(null);
      await service.syncProjectUsedValue('ws-1');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should sync project used value', async () => {
      const usageLimit = { id: 'ul-1', limitValue: 5, usedValue: 0 };
      mockRepo.findByWorkspaceAndResource.mockResolvedValue(usageLimit);
      mockRepo.countProjectsByWorkspaceId.mockResolvedValue(3);
      await service.syncProjectUsedValue('ws-1');
      expect(mockRepo.save).toHaveBeenCalledWith(
        { ...usageLimit, usedValue: 3 },
        undefined,
      );
    });
  });
});
