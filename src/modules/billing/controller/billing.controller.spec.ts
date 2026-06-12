import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BILLING_TYPES } from '../interfaces/types';

describe('BillingController', () => {
  let controller: BillingController;

  const mockCreateApp = { createPayment: jest.fn() };
  const mockQueryApp = { getCurrentSubscription: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BILLING_TYPES.applications.CreateBillingApplication, useValue: mockCreateApp },
        { provide: BILLING_TYPES.applications.BillingQueryApplication, useValue: mockQueryApp },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create payment', () => {
    mockCreateApp.createPayment.mockResolvedValue({ orderUrl: 'url' });
    const req = {
      user: { id: 'u-1' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
    } as any;
    const result = controller.createPayment({ planId: 'plan-1' } as any, req);
    expect(mockCreateApp.createPayment).toHaveBeenCalled();
    expect(result).resolves.toEqual({ orderUrl: 'url' });
  });

  it('should throw if no user id when creating payment', () => {
    const req = {
      user: {},
      headers: {},
      ip: '127.0.0.1',
      socket: {},
    } as any;
    expect(() => controller.createPayment({ planId: 'plan-1' } as any, req)).toThrow('User id not found in request');
  });

  it('should get current subscription', async () => {
    mockQueryApp.getCurrentSubscription.mockResolvedValue({ id: 'sub-1' });
    const req = {
      user: { id: 'u-1' },
    } as any;
    const result = await controller.getCurrentSubscription(req);
    expect(mockQueryApp.getCurrentSubscription).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'sub-1' });
  });
});
