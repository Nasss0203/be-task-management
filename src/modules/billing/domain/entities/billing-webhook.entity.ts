import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { BillingProvider, Subscription } from './subscription.entity';

export enum BillingWebhookStatus {
  RECEIVED = 'RECEIVED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  IGNORED = 'IGNORED',
}

@Entity('billing_webhooks')
@Index(['provider', 'providerEventId'], { unique: true })
@Index(['userId'])
@Index(['targetWorkspaceId'])
@Index(['subscriptionId'])
@Index(['paymentId'])
@Index(['invoiceId'])
@Index(['eventType'])
@Index(['status'])
@Index(['createdAt'])
export class BillingWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'target_workspace_id', type: 'uuid', nullable: true })
  targetWorkspaceId: string | null;

  @ManyToOne(() => Workspace, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_workspace_id' })
  targetWorkspace: Workspace | null;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => Subscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription | null;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @ManyToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment | null;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null;

  @ManyToOne(() => Invoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;

  @Column({
    type: 'enum',
    enum: BillingProvider,
  })
  provider: BillingProvider;

  /**
   * Dùng để chống xử lý webhook trùng.
   *
   * Ví dụ:
   * MOMO:${orderId}:${requestId}:${transId}
   * VNPAY:${vnp_TxnRef}:${vnp_TransactionNo}:${vnp_ResponseCode}
   */
  @Column({
    name: 'provider_event_id',
    type: 'varchar',
    length: 255,
  })
  providerEventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType: string;

  @Column({ name: 'order_code', type: 'varchar', length: 100, nullable: true })
  orderCode: string | null;

  @Column({
    name: 'provider_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerTransactionId: string | null;

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
