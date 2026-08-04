import { Test, TestingModule } from '@nestjs/testing';
import { VnpayIpnService } from './vnpay-ipn.service';
import { BILLING_TYPES } from '../../interfaces/types';
import { PaymentStatus } from '../../domain/entities/payment.entity';
import {
  IpnFailChecksum,
  IpnInvalidAmount,
  IpnOrderNotFound,
  IpnSuccess,
  IpnUnknownError,
} from 'vnpay';

describe('VnpayIpnService', () => {
  let service: VnpayIpnService;

  const mockProvider = {
    verifyReturnUrl: jest.fn(),
    verifyIpn: jest.fn(),
  };

  const mockPaymentRepo = {
    findPaymentByOrderCode: jest.fn(),
    markPaymentStatusFailed: jest.fn(),
    markPaymentSucceeded: jest.fn(),
  };

  const mockCompleteService = {
    complete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VnpayIpnService,
        {
          provide: BILLING_TYPES.providers.VnpayPaymentProvider,
          useValue: mockProvider,
        },
        {
          provide: BILLING_TYPES.repositories.PaymentRepository,
          useValue: mockPaymentRepo,
        },
        {
          provide: BILLING_TYPES.services.CompletePaymentService,
          useValue: mockCompleteService,
        },
      ],
    }).compile();

    service = module.get<VnpayIpnService>(VnpayIpnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleReturn', () => {
    it('should handle invalid checksum', async () => {
      mockProvider.verifyReturnUrl.mockResolvedValue({ isVerified: false });
      const result = await service.handleReturn({} as any);
      expect(result.processingCode).toEqual('FAIL_CHECKSUM');
    });

    it('should handle order not found by order code', async () => {
      mockProvider.verifyReturnUrl.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue(null);
      const result = await service.handleReturn({} as any);
      expect(result.processingCode).toEqual('ORDER_NOT_FOUND');
    });

    it('should handle invalid amount', async () => {
      mockProvider.verifyReturnUrl.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
        vnp_Amount: '1000',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        amount: 2000,
        status: PaymentStatus.PENDING,
      });
      const result = await service.handleReturn({} as any);
      expect(result.processingCode).toEqual('INVALID_AMOUNT');
      expect(mockPaymentRepo.markPaymentStatusFailed).toHaveBeenCalled();
    });

    it('should handle payment failed', async () => {
      mockProvider.verifyReturnUrl.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
        vnp_Amount: '1000',
        vnp_ResponseCode: '24',
        vnp_TransactionStatus: '02',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        amount: 1000,
        status: PaymentStatus.PENDING,
      });
      const result = await service.handleReturn({} as any);
      expect(result.processingCode).toEqual('PAYMENT_FAILED');
      expect(mockPaymentRepo.markPaymentStatusFailed).toHaveBeenCalled();
    });

    it('should handle payment success', async () => {
      mockProvider.verifyReturnUrl.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
        vnp_Amount: '1000',
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
        vnp_TransactionNo: 'TXN_1',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        amount: 1000,
        status: PaymentStatus.PENDING,
      });
      mockPaymentRepo.markPaymentSucceeded.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.SUCCEEDED,
      });

      const result = await service.handleReturn({} as any);
      expect(result.processingCode).toEqual('SUCCEEDED');
      expect(mockPaymentRepo.markPaymentSucceeded).toHaveBeenCalled();
      expect(mockCompleteService.complete).toHaveBeenCalledWith({
        paymentId: 'pay-1',
      });
    });

    it('should handle already succeeded', async () => {
      mockProvider.verifyReturnUrl.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.SUCCEEDED,
      });
      const result = await service.handleReturn({} as any);
      expect(result.processingCode).toEqual('ALREADY_SUCCEEDED');
    });
  });

  describe('handleIpn', () => {
    it('should handle FAIL_CHECKSUM', async () => {
      mockProvider.verifyIpn.mockResolvedValue({ isVerified: false });
      const result = await service.handleIpn({} as any);
      expect(result).toEqual(IpnFailChecksum);
    });

    it('should handle ORDER_NOT_FOUND', async () => {
      mockProvider.verifyIpn.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: null,
      });
      const result = await service.handleIpn({} as any);
      expect(result).toEqual(IpnOrderNotFound);
    });

    it('should handle INVALID_AMOUNT', async () => {
      mockProvider.verifyIpn.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
        vnp_Amount: '1000',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        amount: 2000,
        status: PaymentStatus.PENDING,
      });
      const result = await service.handleIpn({} as any);
      expect(result).toEqual(IpnInvalidAmount);
    });

    it('should handle SUCCEEDED', async () => {
      mockProvider.verifyIpn.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
        vnp_Amount: '1000',
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        amount: 1000,
        status: PaymentStatus.PENDING,
      });
      mockPaymentRepo.markPaymentSucceeded.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.SUCCEEDED,
      });
      const result = await service.handleIpn({} as any);
      expect(result).toEqual(IpnSuccess);
    });

    it('should handle UNKNOWN_ERROR', async () => {
      mockProvider.verifyIpn.mockResolvedValue({
        isVerified: true,
        vnp_TxnRef: 'PAY_1',
        vnp_Amount: '1000',
        vnp_ResponseCode: '24',
        vnp_TransactionStatus: '02',
      });
      mockPaymentRepo.findPaymentByOrderCode.mockResolvedValue({
        id: 'pay-1',
        amount: 1000,
        status: PaymentStatus.PENDING,
      });
      const result = await service.handleIpn({} as any);
      expect(result).toEqual(IpnUnknownError);
    });
  });
});
