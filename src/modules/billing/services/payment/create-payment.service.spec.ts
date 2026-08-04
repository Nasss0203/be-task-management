import { Test, TestingModule } from '@nestjs/testing';
import { CreateBillingServiceImpl } from './create-payment.service';
import { BILLING_TYPES } from '../../interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CreateBillingServiceImpl', () => {
  let service: CreateBillingServiceImpl;

  const mockPlanRepo = {
    findActivePlanById: jest.fn(),
  };

  const mockPaymentRepo = {
    createPendingPayment: jest.fn(),
    updatePaymentGateway: jest.fn(),
    markPaymentFailed: jest.fn(),
  };

  const mockProvider = {
    createPayment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBillingServiceImpl,
        {
          provide: BILLING_TYPES.repositories.PlanRepository,
          useValue: mockPlanRepo,
        },
        {
          provide: BILLING_TYPES.repositories.PaymentRepository,
          useValue: mockPaymentRepo,
        },
        {
          provide: BILLING_TYPES.providers.VnpayPaymentProvider,
          useValue: mockProvider,
        },
        {
          provide: BILLING_TYPES.providers.StripePaymentProvider,
          useValue: mockProvider,
        },
      ],
    }).compile();

    service = module.get<CreateBillingServiceImpl>(CreateBillingServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if plan not found', async () => {
    mockPlanRepo.findActivePlanById.mockResolvedValue(null);
    await expect(
      service.createPayment({
        dto: { planId: 'plan-1' },
        userId: 'u-1',
        ipAddress: '127.0.0.1',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw if plan is free', async () => {
    mockPlanRepo.findActivePlanById.mockResolvedValue({ priceAmount: 0 });
    await expect(
      service.createPayment({
        dto: { planId: 'plan-1' },
        userId: 'u-1',
        ipAddress: '127.0.0.1',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create payment', async () => {
    mockPlanRepo.findActivePlanById.mockResolvedValue({
      name: 'Pro',
      priceAmount: 100000,
    });
    mockPaymentRepo.createPendingPayment.mockResolvedValue({ id: 'pay-1' });
    mockProvider.createPayment.mockReturnValue({
      paymentUrl: 'url',
      providerOrderId: 'order-1',
      providerRequestId: 'req-1',
      providerTransactionId: 'txn-1',
      rawResponse: { expiredAt: new Date() },
    });
    mockPaymentRepo.updatePaymentGateway.mockResolvedValue({
      id: 'pay-1',
      orderCode: 'PAY_1',
      provider: 'vnpay',
      amount: 100000,
      currency: 'VND',
      status: 'PENDING',
      paymentUrl: 'url',
    });

    const result = await service.createPayment({
      dto: { planId: 'plan-1' },
      userId: 'u-1',
      ipAddress: '127.0.0.1',
    } as any);
    expect(mockPaymentRepo.createPendingPayment).toHaveBeenCalled();
    expect(mockProvider.createPayment).toHaveBeenCalled();
    expect(mockPaymentRepo.updatePaymentGateway).toHaveBeenCalled();
    expect(result.paymentUrl).toEqual('url');
  });

  it('should handle gateway error', async () => {
    mockPlanRepo.findActivePlanById.mockResolvedValue({
      name: 'Pro',
      priceAmount: 100000,
    });
    mockPaymentRepo.createPendingPayment.mockResolvedValue({ id: 'pay-1' });
    mockProvider.createPayment.mockImplementation(() => {
      throw new Error('Gateway error');
    });

    await expect(
      service.createPayment({
        dto: { planId: 'plan-1' },
        userId: 'u-1',
        ipAddress: '127.0.0.1',
      } as any),
    ).rejects.toThrow('Gateway error');
    expect(mockPaymentRepo.markPaymentFailed).toHaveBeenCalled();
  });
});
