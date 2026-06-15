export const BILLING_TYPES = {
  providers: {
    MomoPaymentProvider: 'MomoPaymentProvider',
    VnpayPaymentProvider: 'VnpayPaymentProvider',
    StripePaymentProvider: 'StripePaymentProvider',
  },

  applications: {
    CreateBillingApplication: 'CreateBillingApplication',
    BillingQueryApplication: 'BillingQueryApplication',
  },
  services: {
    CreateBillingService: 'CreateBillingService',
    BillingQueryService: 'BillingQueryService',
    CheckWorkspaceLimitService: 'CheckWorkspaceLimitService',
    UsageLimitEnforcerService: 'UsageLimitEnforcerService',
    CompletePaymentService: 'CompletePaymentService',
    StripeWebhookService: 'StripeWebhookService',
  },
  repositories: {
    PlanRepository: 'BillingPlanRepository',
    PaymentRepository: 'BillingPaymentRepository',
    BillingQueryRepository: 'BillingQueryRepository',
    WorkspaceLimitRepository: 'BillingWorkspaceLimitRepository',
    UsageLimitRepository: 'BillingUsageLimitRepository',
  },
};
