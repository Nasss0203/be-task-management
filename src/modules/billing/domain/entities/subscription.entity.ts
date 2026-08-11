import { User } from 'src/modules/users/domain/entities/user.entity';
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
import { Plan, PlanBillingInterval } from './plan.entity';

export enum BillingProvider {
  MANUAL = 'MANUAL',
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
  STRIPE = 'STRIPE',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  INCOMPLETE = 'INCOMPLETE',
}

@Entity('subscriptions')
@Index(['userId'])
@Index(['planId'])
@Index(['status'])
@Index(['userId', 'status'])
@Index(['provider', 'providerSubscriptionId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Người mua gói.
   * Subscription này áp dụng cho user,
   * còn workspace nào được nâng cấp nằm ở bảng subscription_workspaces.
   */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: BillingProvider,
    default: BillingProvider.MANUAL,
  })
  provider: BillingProvider;

  /**
   * Với MoMo/VNPAY thường có thể null,
   * vì mình tự quản lý subscription.
   * Sau này nếu dùng Stripe thì field này hữu ích.
   */
  @Column({
    name: 'provider_subscription_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerSubscriptionId: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'trial_end', type: 'timestamp', nullable: true })
  trialEnd: Date | null;

  @Column({ name: 'amount', type: 'int', default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({
    name: 'billing_interval',
    type: 'enum',
    enum: PlanBillingInterval,
    enumName: 'plans_billing_interval_enum',
    default: PlanBillingInterval.MONTH,
  })
  billingInterval: PlanBillingInterval;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
