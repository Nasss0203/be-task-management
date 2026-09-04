import { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import { PaymentOrderStatus } from 'src/modules/billing/domain/constants/payment-order-status.constant';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_orders')
@Index('UQ_payment_orders_order_code', ['order_code'], {
  unique: true,
})
@Index('IDX_payment_orders_workspace_id', ['workspace_id'])
@Index('IDX_payment_orders_status', ['status'])
export class PaymentOrderOrmEntity {
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
    nullable: true,
  })
  subscription_id: string | null;

  @Column({
    type: 'uuid',
  })
  plan_price_id: string;

  @Column({
    type: 'enum',
    enum: BillingProvider,
  })
  provider: BillingProvider;

  @Column({
    type: 'varchar',
    length: 100,
  })
  order_code: string;

  @Column({
    type: 'bigint',
  })
  amount: string;

  @Column({
    type: 'varchar',
    length: 3,
  })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentOrderStatus,
    default: PaymentOrderStatus.PENDING,
  })
  status: PaymentOrderStatus;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  expires_at: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  paid_at: Date | null;

  @Column({
    type: 'uuid',
  })
  created_by: string;

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
