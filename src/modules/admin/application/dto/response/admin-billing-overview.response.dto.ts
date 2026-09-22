export class AdminBillingOverviewResponseDto {
  paidRevenueThisMonth: number;
  activeSubscriptions: number;
  pendingPayments: number;
  failedOrExpiredPayments: number;
  failedWebhookEvents: number;
  currency: string;
}
