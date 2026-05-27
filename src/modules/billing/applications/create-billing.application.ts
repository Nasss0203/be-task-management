import { Inject, Injectable } from '@nestjs/common';

import { type CreateBillingApplication } from '../interfaces/applications/create-billing.application.interface';
import {
  type CreateBillingService,
  type CreatePaymentServiceInput,
  type CreatePaymentServiceResponse,
} from '../interfaces/services/payment/create-payment.service.interface';
import { BILLING_TYPES } from '../interfaces/types';

@Injectable()
export class CreateBillingApplicationImpl implements CreateBillingApplication {
  constructor(
    @Inject(BILLING_TYPES.services.CreateBillingService)
    private readonly createBillingService: CreateBillingService,
  ) {}

  createPayment(
    input: CreatePaymentServiceInput,
  ): Promise<CreatePaymentServiceResponse> {
    return this.createBillingService.createPayment(input);
  }
}
