import type { SubscriptionNoticeDetails } from './subscription-expiry-reader.port';

export type SubscriptionExpiryReminder = SubscriptionNoticeDetails & {
  expiredAt: Date;
  downgradeAt: Date;
};

export type SubscriptionDowngradeNotice = SubscriptionNoticeDetails & {
  downgradedAt: Date;
};

export interface SubscriptionNoticeSender {
  sendExpiryReminder(notice: SubscriptionExpiryReminder): Promise<void>;

  sendDowngradeNotice(notice: SubscriptionDowngradeNotice): Promise<void>;
}
