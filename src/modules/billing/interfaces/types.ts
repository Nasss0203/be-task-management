export const BILLING_TYPES = {
  providers: {
    MomoPaymentProvider: 'MomoPaymentProvider',
    VnpayPaymentProvider: 'VnpayPaymentProvider',
  },

  applications: {},
  services: {
    CreateBillingService: 'CreateBillingService',
  },
  repositories: {
    PlanRepository: 'BillingPlanRepository',
    PaymentRepository: 'BillingPaymentRepository',
  },
};
