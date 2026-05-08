import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingProvider } from './subscription.entity';

export enum BillingWebhookStatus {
  RECEIVED = 'RECEIVED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  IGNORED = 'IGNORED',
}

@Entity('billing_webhooks')
@Index(['provider', 'providerEventId'], { unique: true })
@Index(['eventType'])
@Index(['status'])
@Index(['createdAt'])
export class BillingWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BillingProvider,
  })
  provider: BillingProvider;

  @Column({
    name: 'provider_event_id',
    type: 'varchar',
    length: 255,
  })
  providerEventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType: string;

  @Column({
    type: 'enum',
    enum: BillingWebhookStatus,
    default: BillingWebhookStatus.RECEIVED,
  })
  status: BillingWebhookStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
