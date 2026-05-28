import { Inject, Injectable } from '@nestjs/common';
import {
  IpnFailChecksum,
  IpnOrderNotFound,
  IpnSuccess,
  IpnUnknownError,
  type ReturnQueryFromVNPay,
} from 'vnpay';

import { PaymentStatus } from '../../domain/entities/payment.entity';
import { type PaymentRepository } from '../../interfaces/repositories/payment/payment.repository.interface';
import { BILLING_TYPES } from '../../interfaces/types';
import {
  type VnpayPaymentProvider,
  type VnpayVerifyResult,
} from '../../types/payment-input.interface';
import { CompletePaymentService } from '../complete-payment/complete-payment.service';

@Injectable()
export class VnpayIpnService {
  constructor(
    @Inject(BILLING_TYPES.providers.VnpayPaymentProvider)
    private readonly vnpayPaymentProvider: VnpayPaymentProvider,

    @Inject(BILLING_TYPES.repositories.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,

    private readonly completePaymentService: CompletePaymentService,
  ) {}

  async handleIpn(query: ReturnQueryFromVNPay) {
    const verify = await this.vnpayPaymentProvider.verifyIpn(query);

    if (!verify.isVerified) {
      return IpnFailChecksum;
    }

    const orderCode = verify.vnp_TxnRef;

    if (!orderCode) {
      return IpnOrderNotFound;
    }

    const payment =
      await this.paymentRepository.findPaymentByOrderCode(orderCode);

    if (!payment) {
      return IpnOrderNotFound;
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return IpnSuccess;
    }

    const metadata = this.toMetadata(verify);

    if (payment.amount !== Number(verify.vnp_Amount)) {
      await this.paymentRepository.markPaymentStatusFailed({
        paymentId: payment.id,
        failedReason: 'Invalid payment amount',
        metadata,
      });

      return IpnUnknownError;
    }

    if (!verify.isSuccess) {
      await this.paymentRepository.markPaymentStatusFailed({
        paymentId: payment.id,
        failedReason: verify.message ?? 'VNPAY payment failed',
        metadata,
      });

      return IpnUnknownError;
    }

    const succeededPayment = await this.paymentRepository.markPaymentSucceeded({
      paymentId: payment.id,
      providerTransactionId: verify.vnp_TransactionNo ?? null,
      metadata,
    });

    await this.completePaymentService.complete({
      paymentId: succeededPayment.id,
    });

    return IpnSuccess;
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
}
