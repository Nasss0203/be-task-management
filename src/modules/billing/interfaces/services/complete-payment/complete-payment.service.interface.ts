export interface CompletePaymentInput {
  paymentId: string;
}

export interface CompletePaymentService {
  complete(input: CompletePaymentInput): Promise<void>;
}
