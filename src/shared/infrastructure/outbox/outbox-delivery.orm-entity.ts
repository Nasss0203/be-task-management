import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type OutboxDeliveryChannel = 'IN_APP_NOTIFICATION' | 'EMAIL';
export type OutboxDeliveryStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

@Entity('outbox_deliveries')
@Index('UQ_outbox_deliveries_delivery_key', ['deliveryKey'], { unique: true })
@Index('IDX_outbox_deliveries_due', ['status', 'nextAttemptAt'])
@Index('IDX_outbox_deliveries_lease', ['status', 'lockedUntil'])
@Check('CHK_outbox_deliveries_status', `"status" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED')`)
@Check('CHK_outbox_deliveries_channel', `"channel" IN ('IN_APP_NOTIFICATION', 'EMAIL')`)
@Check('CHK_outbox_deliveries_attempt_count', '"attempt_count" >= 0')
export class OutboxDeliveryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'delivery_key', type: 'varchar', length: 100 })
  deliveryKey: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'event_version', type: 'integer' })
  eventVersion: number;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId: string;

  @Column({ type: 'varchar', length: 32 })
  channel: OutboxDeliveryChannel;

  @Column({ type: 'jsonb' })
  payload: { invitationId: string };

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: OutboxDeliveryStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'next_attempt_at', type: 'timestamptz', default: () => 'now()' })
  nextAttemptAt: Date;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'locked_by', type: 'uuid', nullable: true })
  lockedBy: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
