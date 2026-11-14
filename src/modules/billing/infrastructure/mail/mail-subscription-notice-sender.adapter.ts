import { Injectable } from '@nestjs/common';

import { MailService } from 'src/modules/mail/application/services/mail.service';
import type {
  SubscriptionDowngradeNotice,
  SubscriptionExpiryReminder,
  SubscriptionNoticeSender,
} from '../../application/ports/subscription-notice-sender.port';
import type { SubscriptionNoticeDetails } from '../../application/ports/subscription-expiry-reader.port';
import { BILLING_TIME_ZONE } from '../../domain/constants/subscription-expiry.constant';

const APP_NAME = 'Taskmanly';

const formatDateTime = (date: Date): string =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: BILLING_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);

@Injectable()
export class MailSubscriptionNoticeSender implements SubscriptionNoticeSender {
  constructor(private readonly mailService: MailService) {}

  async sendExpiryReminder(notice: SubscriptionExpiryReminder): Promise<void> {
    await this.send(notice, {
      subject: `Gói ${notice.planName} của ${notice.workspaceName} đã hết hạn`,
      heading: 'Gói của bạn đã hết hạn',
      message: `Gói ${notice.planName} đã hết hạn lúc ${formatDateTime(notice.expiredAt)}. Workspace vẫn dùng được gói này đến khi chuyển về Free. Hãy thanh toán để giữ gói.`,
      dateLabel: 'Chuyển về Free lúc',
      dateValue: formatDateTime(notice.downgradeAt),
      actionLabel: 'Gia hạn gói →',
    });
  }

  async sendDowngradeNotice(
    notice: SubscriptionDowngradeNotice,
  ): Promise<void> {
    await this.send(notice, {
      subject: `${notice.workspaceName} đã chuyển về gói Free`,
      heading: 'Workspace đã chuyển về gói Free',
      message: `Gói ${notice.planName} chưa được gia hạn nên workspace đã chuyển về gói Free. Dữ liệu vẫn được giữ nguyên; các giới hạn của gói Free được áp dụng từ bây giờ.`,
      dateLabel: 'Chuyển về Free lúc',
      dateValue: formatDateTime(notice.downgradedAt),
      actionLabel: 'Xem các gói →',
    });
  }

  private async send(
    details: SubscriptionNoticeDetails,
    content: {
      subject: string;
      heading: string;
      message: string;
      dateLabel: string;
      dateValue: string;
      actionLabel: string;
    },
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') ?? '';

    await this.mailService.sendEmailTemplates({
      to: details.recipientEmail,
      subject: content.subject,
      template: 'subscription-notice',
      context: {
        appName: APP_NAME,
        recipientName: details.recipientName,
        workspaceName: details.workspaceName,
        planName: details.planName,
        heading: content.heading,
        message: content.message,
        dateLabel: content.dateLabel,
        dateValue: content.dateValue,
        actionLabel: content.actionLabel,
        actionUrl: `${frontendUrl}/pricing`,
        year: new Date().getFullYear(),
      },
    });
  }
}
