import { Test, TestingModule } from '@nestjs/testing';
import { CreateBillingApplicationImpl } from './create-billing.application';
import { BILLING_TYPES } from '../interfaces/types';

describe('CreateBillingApplicationImpl', () => {
  let app: CreateBillingApplicationImpl;

  const mockService = {
    createPayment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBillingApplicationImpl,
        { provide: BILLING_TYPES.services.CreateBillingService, useValue: mockService },
      ],
    }).compile();

    app = module.get<CreateBillingApplicationImpl>(CreateBillingApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should create payment', async () => {
    mockService.createPayment.mockResolvedValue({ orderUrl: 'http://example.com' });
    const result = await app.createPayment({ planId: 'plan-1', userId: 'u-1', billingType: 'monthly' });
    expect(mockService.createPayment).toHaveBeenCalledWith({ planId: 'plan-1', userId: 'u-1', billingType: 'monthly' });
    expect(result).toEqual({ orderUrl: 'http://example.com' });
  });
});
