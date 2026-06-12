import { Test, TestingModule } from '@nestjs/testing';
import { BillingTestVnpayController } from './billing-test-payment.controller';
import { BILLING_TYPES } from '../interfaces/types';
import { VnpayIpnService } from '../services/ipn/vnpay-ipn.service';

describe('BillingTestVnpayController', () => {
  let controller: BillingTestVnpayController;

  const mockProvider = {
    createPayment: jest.fn(),
  };

  const mockIpnService = {
    handleReturn: jest.fn(),
    handleIpn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingTestVnpayController],
      providers: [
        { provide: BILLING_TYPES.providers.VnpayPaymentProvider, useValue: mockProvider },
        { provide: VnpayIpnService, useValue: mockIpnService },
      ],
    }).compile();

    controller = module.get<BillingTestVnpayController>(BillingTestVnpayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create payment', () => {
    mockProvider.createPayment.mockReturnValue({ paymentUrl: 'url' });
    const req = {
      headers: { 'x-forwarded-for': '127.0.0.1' },
    } as any;
    const result = controller.createPayment({ amount: 100000 }, req);
    expect(mockProvider.createPayment).toHaveBeenCalled();
    expect(result).toHaveProperty('paymentUrl', 'url');
  });

  it('should get client ip from remote address', () => {
    mockProvider.createPayment.mockReturnValue({ paymentUrl: 'url' });
    const req = {
      headers: {},
      ip: '127.0.0.2',
      socket: {},
    } as any;
    controller.createPayment({ amount: 100000 }, req);
    expect(mockProvider.createPayment).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: '127.0.0.2' }));
  });

  it('should handle return', async () => {
    mockIpnService.handleReturn.mockResolvedValue('return');
    const result = await controller.handleReturn({} as any);
    expect(mockIpnService.handleReturn).toHaveBeenCalled();
    expect(result).toEqual('return');
  });

  it('should handle ipn', async () => {
    mockIpnService.handleIpn.mockResolvedValue('ipn');
    const result = await controller.handleIpn({} as any);
    expect(mockIpnService.handleIpn).toHaveBeenCalled();
    expect(result).toEqual('ipn');
  });
});
