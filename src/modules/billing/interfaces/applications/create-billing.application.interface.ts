import {
  CreatePaymentServiceInput,
  CreatePaymentServiceResponse,
} from '../services/payment/create-payment.service.interface';

export interface CreateBillingApplication {
  createPayment(
    input: CreatePaymentServiceInput,
  ): Promise<CreatePaymentServiceResponse>;
}
