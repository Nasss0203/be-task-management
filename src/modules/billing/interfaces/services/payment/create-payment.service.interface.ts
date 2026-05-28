import { EntityManager } from 'typeorm';
import { CreatePaymentDto } from '../../../dto/create-payment.dto';
import { PaymentStatus } from '../../../domain/entities/payment.entity';
import { BillingProvider } from '../../../domain/entities/subscription.entity';

export interface CreatePaymentServiceInput {
  userId: string;
  ipAddress: string;
  dto: CreatePaymentDto;
}

export interface CreatePaymentServiceResponse {
  paymentId: string;
  orderCode: string;
  provider: BillingProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentUrl: string;
}

export interface CreateBillingService {
  createPayment(
    input: CreatePaymentServiceInput,
    manager?: EntityManager,
  ): Promise<CreatePaymentServiceResponse>;
}
