import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  SubscriptionExpiryCandidate,
  SubscriptionExpiryReader,
  SubscriptionNoticeDetails,
} from '../../../../application/ports/subscription-expiry-reader.port';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';

const DUE_SQL = `SELECT s.id AS subscription_id, (w.deleted_at IS NOT NULL) AS workspace_in_trash
  FROM workspace_subscriptions s
  JOIN workspaces w ON w.id = s.workspace_id
  WHERE s.plan_price_id IS NOT NULL
    AND s.status IN ($1, $2)
    AND s.current_period_end <= $3
  ORDER BY s.current_period_end`;

const NOTICE_SQL = `SELECT u.email, u.username, w.name AS workspace_name, p.name AS plan_name
  FROM users u
  JOIN workspaces w ON w.id = $1
  JOIN billing_plans p ON p.id = $2
  WHERE u.id = $3 AND u.deleted_at IS NULL`;

type DueRow = { subscription_id: string; workspace_in_trash: boolean };

type NoticeRow = {
  email: string;
  username: string;
  workspace_name: string;
  plan_name: string;
};

@Injectable()
export class SqlSubscriptionExpiryReader implements SubscriptionExpiryReader {
  constructor(private readonly dataSource: DataSource) {}

  async findDue(now: Date): Promise<SubscriptionExpiryCandidate[]> {
    const rows: DueRow[] = await this.dataSource.query(DUE_SQL, [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PAST_DUE,
      now,
    ]);

    return rows.map((row) => ({
      subscriptionId: row.subscription_id,
      workspaceInTrash: row.workspace_in_trash,
    }));
  }

  async findNoticeDetails(input: {
    workspaceId: string;
    planId: string;
    recipientUserId: string;
  }): Promise<SubscriptionNoticeDetails | null> {
    const rows: NoticeRow[] = await this.dataSource.query(NOTICE_SQL, [
      input.workspaceId,
      input.planId,
      input.recipientUserId,
    ]);
    const row = rows[0];

    return row
      ? {
          recipientEmail: row.email,
          recipientName: row.username,
          workspaceName: row.workspace_name,
          planName: row.plan_name,
        }
      : null;
  }
}
