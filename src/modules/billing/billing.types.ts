export const BILLING_TYPES = {
  repositories: {
    BillingPlanRepository: Symbol('BillingPlanRepository'),
    BillingFeatureRepository: Symbol('BillingFeatureRepository'),
    BillingPlanFeatureRepository: Symbol('BillingPlanFeatureRepository'),
    BillingPlanPriceRepository: Symbol('BillingPlanPriceRepository'),
    PaymentOrderRepository: Symbol('PaymentOrderRepository'),
    WorkspaceSubscriptionRepository: Symbol('WorkspaceSubscriptionRepository'),
    BillingWebhookEventRepository: Symbol('BillingWebhookEventRepository'),
  },

  applications: {
    ListBillingPlansHandler: Symbol('BillingListBillingPlansHandler'),
    CreateBillingCheckoutHandler: Symbol('BillingCreateBillingCheckoutHandler'),
    ProcessSepayWebhookHandler: Symbol('BillingProcessSepayWebhookHandler'),
    ProcessSepayPgIpnHandler: Symbol('BillingProcessSepayPgIpnHandler'),
    ProcessStripeWebhookHandler: Symbol('BillingProcessStripeWebhookHandler'),
    GetBillingPaymentStatusHandler: Symbol('GetBillingPaymentStatusHandler'),
    GetWorkspaceSubscriptionHandler: Symbol('GetWorkspaceSubscriptionHandler'),
    GetCheckoutQuoteHandler: Symbol('BillingGetCheckoutQuoteHandler'),
    ListWorkspacePaymentOrdersHandler: Symbol(
      'ListWorkspacePaymentOrdersHandler',
    ),
    GetWorkspaceEntitlementsHandler: Symbol('GetWorkspaceEntitlementsHandler'),
    CancelSubscriptionHandler: Symbol('BillingCancelSubscriptionHandler'),
    ResumeSubscriptionHandler: Symbol('BillingResumeSubscriptionHandler'),
    ProcessSubscriptionExpiryHandler: Symbol(
      'BillingProcessSubscriptionExpiryHandler',
    ),
  },

  services: {
    WorkspaceSubscriptionProvisioningService: Symbol(
      'WorkspaceSubscriptionProvisioningService',
    ),
    BillingPaymentSettlementService: Symbol('BillingPaymentSettlementService'),
    PlanChangeQuoteService: Symbol('BillingPlanChangeQuoteService'),
    BillingEntitlementService: Symbol('BillingEntitlementService'),
    WorkspaceUsageReader: Symbol('BillingWorkspaceUsageReader'),
    WorkspaceEntitlementPort: Symbol('WorkspaceEntitlementPort'),
    SubscriptionExpiryReader: Symbol('BillingSubscriptionExpiryReader'),
    SubscriptionNoticeSender: Symbol('BillingSubscriptionNoticeSender'),
    SubscriptionLifecyclePort: Symbol('BillingSubscriptionLifecyclePort'),
  },
} as const;
