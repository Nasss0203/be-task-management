import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingWebhookStatus } from '../../../../domain/constants/billing-webhook-status.constant';

@Entity('billing_webhook_events')
@Unique('UQ_billing_webhook_events_provider_event', [
  'provider',
  'provider_event_id',
])
@Index('IDX_billing_webhook_events_status', ['status'])
export class BillingWebhookEventOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'enum',
    enum: BillingProvider,
  })
  provider: BillingProvider;

  @Column({
    type: 'varchar',
    length: 255,
  })
  provider_event_id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  event_type: string;

  @Column({
    type: 'jsonb',
  })
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: BillingWebhookStatus,
    default: BillingWebhookStatus.PENDING,
  })
  status: BillingWebhookStatus;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  processed_at: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;
}
