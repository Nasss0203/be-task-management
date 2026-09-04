import { BillingInterval } from 'src/modules/billing/domain/constants/billing-interval.constant';
import { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('billing_plan_prices')
@Index('IDX_billing_plan_prices_plan_id', ['plan_id'])
@Index('IDX_billing_plan_prices_provider', ['provider'])
export class BillingPlanPriceOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  plan_id: string;

  @Column({
    type: 'enum',
    enum: BillingInterval,
  })
  billing_interval: BillingInterval;

  @Column({
    type: 'varchar',
    length: 3,
  })
  currency: string;

  /**
   * Lưu theo smallest currency unit.
   *
   * 99000 VND = 99.000đ
   * 499 USD cents = $4.99
   */
  @Column({
    type: 'bigint',
  })
  amount: string;

  @Column({
    type: 'enum',
    enum: BillingProvider,
  })
  provider: BillingProvider;

  /**
   * Ví dụ Stripe:
   * price_123456
   *
   * SePay có thể null.
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  provider_price_id: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active: boolean;

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
