import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { MarketplaceWebhookStatus } from '../../../../domain/constants/marketplace-webhook-status.constant';

@Entity('marketplace_webhook_events')
@Unique('UQ_marketplace_webhook_events_provider_event', [
  'provider',
  'provider_event_id',
])
@Index('IDX_marketplace_webhook_events_status', ['status'])
export class MarketplaceWebhookEventOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 16,
  })
  provider: string;

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
    type: 'varchar',
    length: 32,
    default: MarketplaceWebhookStatus.PENDING,
  })
  status: MarketplaceWebhookStatus;

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
