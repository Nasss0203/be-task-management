import { Inject, Injectable } from '@nestjs/common';
import {
  IpnFailChecksum,
  IpnInvalidAmount,
  IpnOrderNotFound,
  IpnSuccess,
  IpnUnknownError,
  type ReturnQueryFromVNPay,
} from 'vnpay';

import { PaymentStatus } from '../../domain/entities/payment.entity';
import { type PaymentRepository } from '../../interfaces/repositories/payment/payment.repository.interface';
import { type CompletePaymentService } from '../../interfaces/services/complete-payment/complete-payment.service.interface';
import { BILLING_TYPES } from '../../interfaces/types';
import {
  type VnpayPaymentProvider,
  type VnpayVerifyResult,
} from '../../types/payment-input.interface';

const VNPAY_SUCCESS_CODE = '00';

@Injectable()
export class VnpayIpnService {
  constructor(
    @Inject(BILLING_TYPES.providers.VnpayPaymentProvider)
    private readonly vnpayPaymentProvider: VnpayPaymentProvider,

    @Inject(BILLING_TYPES.repositories.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,

    @Inject(BILLING_TYPES.services.CompletePaymentService)
    private readonly completePaymentService: CompletePaymentService,
  ) {}

  async handleReturn(query: ReturnQueryFromVNPay) {
    const verify = await this.vnpayPaymentProvider.verifyReturnUrl(query);
    const result = await this.processVerifiedPayment(verify);

    return {
      message: 'Return from VNPAY',
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      orderCode: verify.vnp_TxnRef,
      amount: verify.vnp_Amount,
      responseCode: verify.vnp_ResponseCode,
      transactionStatus: verify.vnp_TransactionStatus,
      transactionNo: verify.vnp_TransactionNo,
      bankCode: verify.vnp_BankCode,
      payDate: verify.vnp_PayDate,
      paymentStatus: result.paymentStatus ?? null,
      completed: result.completed,
      processingCode: result.code,
      failureReason: result.failureReason ?? null,
      verify,
    };
  }

  async handleIpn(query: ReturnQueryFromVNPay) {
    const verify = await this.vnpayPaymentProvider.verifyIpn(query);
    const result = await this.processVerifiedPayment(verify);

    if (result.code === 'FAIL_CHECKSUM') {
      return IpnFailChecksum;
    }

    if (result.code === 'ORDER_NOT_FOUND') {
      return IpnOrderNotFound;
    }

    if (result.code === 'INVALID_AMOUNT') {
      return IpnInvalidAmount;
    }

    if (result.completed) {
      return IpnSuccess;
    }

    return IpnUnknownError;
  }

  private async processVerifiedPayment(verify: VnpayVerifyResult): Promise<{
    code:
      | 'FAIL_CHECKSUM'
      | 'ORDER_NOT_FOUND'
      | 'ALREADY_SUCCEEDED'
      | 'INVALID_AMOUNT'
      | 'PAYMENT_FAILED'
      | 'SUCCEEDED';
    completed: boolean;
    paymentStatus?: PaymentStatus;
    failureReason?: string;
  }> {
    if (!verify.isVerified) {
      return {
        code: 'FAIL_CHECKSUM',
        completed: false,
      };
    }

    const orderCode = verify.vnp_TxnRef;

    if (!orderCode) {
      return {
        code: 'ORDER_NOT_FOUND',
        completed: false,
      };
    }

    const payment =
      await this.paymentRepository.findPaymentByOrderCode(orderCode);

    if (!payment) {
      return {
        code: 'ORDER_NOT_FOUND',
        completed: false,
      };
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return {
        code: 'ALREADY_SUCCEEDED',
        completed: true,
        paymentStatus: payment.status,
      };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return {
        code: 'ALREADY_SUCCEEDED',
        completed: true,
        paymentStatus: payment.status,
      };
    }

    const metadata = this.toMetadata(verify);

    if (payment.amount !== Number(verify.vnp_Amount)) {
      await this.paymentRepository.markPaymentStatusFailed({
        paymentId: payment.id,
        failedReason: 'Invalid payment amount',
        metadata,
      });

      return {
        code: 'INVALID_AMOUNT',
        completed: false,
        paymentStatus: PaymentStatus.FAILED,
        failureReason: 'Invalid payment amount',
      };
    }

    if (!this.isSuccessfulVnpayPayment(verify)) {
      const failedReason = verify.message ?? 'VNPAY payment failed';

      await this.paymentRepository.markPaymentStatusFailed({
        paymentId: payment.id,
        failedReason,
        metadata,
      });

      return {
        code: 'PAYMENT_FAILED',
        completed: false,
        paymentStatus: PaymentStatus.FAILED,
        failureReason: failedReason,
      };
    }

    const succeededPayment = await this.paymentRepository.markPaymentSucceeded({
      paymentId: payment.id,
      providerTransactionId: verify.vnp_TransactionNo ?? null,
      metadata,
    });

    await this.completePaymentService.complete({
      paymentId: succeededPayment.id,
    });

    return {
      code: 'SUCCEEDED',
      completed: true,
      paymentStatus: succeededPayment.status,
    };
  }

  private toMetadata(verify: VnpayVerifyResult): Record<string, unknown> {
    return {
      vnp_Amount: verify.vnp_Amount,
      vnp_TxnRef: verify.vnp_TxnRef,
      vnp_ResponseCode: verify.vnp_ResponseCode,
      vnp_TransactionStatus: verify.vnp_TransactionStatus,
      vnp_TransactionNo: verify.vnp_TransactionNo,
      vnp_BankCode: verify.vnp_BankCode,
      vnp_PayDate: verify.vnp_PayDate,
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
    };
  }

  private isSuccessfulVnpayPayment(verify: VnpayVerifyResult): boolean {
    return (
      this.normalizeVnpayCode(verify.vnp_ResponseCode) === VNPAY_SUCCESS_CODE &&
      this.normalizeVnpayCode(verify.vnp_TransactionStatus) ===
        VNPAY_SUCCESS_CODE
    );
  }

  private normalizeVnpayCode(value?: string | number): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    return value.toString().padStart(2, '0');
  }
}
