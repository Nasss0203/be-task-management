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
import { Plan } from './plan.entity';
import { BillingProvider, Subscription } from './subscription.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  QR = 'QR',
  ATM = 'ATM',
  VISA = 'VISA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
  UNKNOWN = 'UNKNOWN',
}

@Entity('payments')
@Index(['userId'])
@Index(['planId'])
@Index(['subscriptionId'])
@Index(['invoiceId'])
@Index(['targetWorkspaceId'])
@Index(['status'])
@Index(['orderCode'], { unique: true })
@Index(['provider', 'providerOrderId'])
@Index(['provider', 'providerRequestId'])
@Index(['provider', 'providerTransactionId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Người thanh toán.
   */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Gói user đang mua.
   */
  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  /**
   * Workspace user muốn ưu tiên upgrade sau khi thanh toán.
   * Có thể null nếu user mua từ trang billing account.
   */
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

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null;

  @ManyToOne(() => Invoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;

  /**
   * Mã đơn hàng nội bộ.
   * Dùng làm:
   * - MoMo orderId
   * - VNPAY vnp_TxnRef
   */
  @Column({ name: 'order_code', type: 'varchar', length: 100 })
  orderCode: string;

  @Column({
    type: 'enum',
    enum: BillingProvider,
    default: BillingProvider.MANUAL,
  })
  provider: BillingProvider;

  @Column({
    name: 'provider_payment_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerPaymentId: string | null;

  /**
   * MoMo: orderId
   * VNPAY: vnp_TxnRef
   */
  @Column({
    name: 'provider_order_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerOrderId: string | null;

  /**
   * MoMo: requestId
   */
  @Column({
    name: 'provider_request_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerRequestId: string | null;

  /**
   * MoMo: transId
   * VNPAY: vnp_TransactionNo
   */
  @Column({
    name: 'provider_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerTransactionId: string | null;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.UNKNOWN,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'amount', type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'payment_url', type: 'text', nullable: true })
  paymentUrl: string | null;

  @Column({ name: 'expired_at', type: 'timestamp', nullable: true })
  expiredAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'failed_reason', type: 'text', nullable: true })
  failedReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
