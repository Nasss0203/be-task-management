import { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import { PaymentTransactionStatus } from 'src/modules/billing/domain/constants/payment-transaction-status.constant';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';

@Entity('payment_transactions')
@Index('IDX_payment_transactions_payment_order_id', ['payment_order_id'])
@Unique('UQ_payment_transactions_provider_transaction', [
  'provider',
  'provider_transaction_id',
])
export class PaymentTransactionOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  payment_order_id: string;

  @Column({
    type: 'enum',
    enum: BillingProvider,
  })
  provider: BillingProvider;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  provider_transaction_id: string | null;

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
    enum: PaymentTransactionStatus,
  })
  status: PaymentTransactionStatus;

  /**
   * Raw data đã normalize/lưu lại từ
   * Stripe hoặc SePay.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  provider_data: Record<string, unknown> | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  paid_at: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;
}
