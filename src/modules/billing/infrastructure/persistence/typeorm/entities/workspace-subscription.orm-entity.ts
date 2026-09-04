import { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import { SubscriptionStatus } from 'src/modules/billing/domain/constants/subscription-status.constant';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workspace_subscriptions')
@Index('IDX_workspace_subscriptions_workspace_id', ['workspace_id'])
@Index('IDX_workspace_subscriptions_plan_id', ['plan_id'])
@Index('IDX_workspace_subscriptions_status', ['status'])
export class WorkspaceSubscriptionOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  workspace_id: string;

  @Column({
    type: 'uuid',
  })
  plan_id: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  plan_price_id: string | null;

  @Column({
    type: 'enum',
    enum: BillingProvider,
    nullable: true,
  })
  provider: BillingProvider | null;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  current_period_start: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  current_period_end: Date | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  cancel_at_period_end: boolean;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  canceled_at: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  provider_customer_id: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  provider_subscription_id: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updated_at: Date;
}
