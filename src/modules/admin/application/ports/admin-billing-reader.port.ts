import type { BillingInterval } from 'src/modules/billing/domain/constants/billing-interval.constant';
import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import type { PaymentOrderStatus } from 'src/modules/billing/domain/constants/payment-order-status.constant';
import type { SubscriptionStatus } from 'src/modules/billing/domain/constants/subscription-status.constant';
import type { PaymentTransactionStatus } from 'src/modules/billing/domain/constants/payment-transaction-status.constant';

export interface AdminBillingOverview {
  paidRevenueThisMonth: number;
  activeSubscriptions: number;
  pendingPayments: number;
  failedOrExpiredPayments: number;
  failedWebhookEvents: number;
  currency: string;
}

export interface ListAdminBillingSubscriptionsInput {
  page: number;
  limit: number;
  search?: string;
  status?: SubscriptionStatus;
  provider?: BillingProvider;
  planCode?: string;
}

export interface AdminBillingWorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

export interface AdminBillingPlanSummary {
  id: string;
  code: string;
  name: string;
}

export interface AdminBillingPlanPriceSummary {
  id: string;
  billingInterval: BillingInterval;
  amount: number;
  currency: string;
}

export interface AdminBillingLatestPaymentSummary {
  id: string;
  orderCode: string;
  provider: BillingProvider;
  status: PaymentOrderStatus;
  amount: number;
  currency: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface AdminBillingSubscriptionSummary {
  id: string;
  workspace: AdminBillingWorkspaceSummary;
  plan: AdminBillingPlanSummary;
  planPrice: AdminBillingPlanPriceSummary | null;
  provider: BillingProvider | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  latestPayment: AdminBillingLatestPaymentSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAdminBillingSubscriptionsResult {
  items: AdminBillingSubscriptionSummary[];
  total: number;
  page: number;
  limit: number;
} 

export interface ListAdminBillingPaymentOrdersInput {
  page: number;
  limit: number;
  search?: string;
  status?: PaymentOrderStatus;
  provider?: BillingProvider;
  planCode?: string;
}

export interface AdminBillingPaymentTransactionSummary {
  id: string;
  provider: BillingProvider;
  providerTransactionId: string | null;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface AdminBillingPaymentOrderSummary {
  id: string;
  subscriptionId: string | null;
  workspace: AdminBillingWorkspaceSummary;
  plan: AdminBillingPlanSummary;
  planPrice: AdminBillingPlanPriceSummary;
  provider: BillingProvider;
  orderCode: string;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdBy: string;
  latestTransaction: AdminBillingPaymentTransactionSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAdminBillingPaymentOrdersResult {
  items: AdminBillingPaymentOrderSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminBillingReader {
  getOverview(): Promise<AdminBillingOverview>;

  listSubscriptions(
    input: ListAdminBillingSubscriptionsInput,
  ): Promise<ListAdminBillingSubscriptionsResult>;

  listPaymentOrders(
    input: ListAdminBillingPaymentOrdersInput,
  ): Promise<ListAdminBillingPaymentOrdersResult>;
}
