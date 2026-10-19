import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';

import {
  TemplatePurchaseProvider,
  TemplatePurchaseStatus,
} from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';

@Entity({ name: 'template_purchases', schema: 'public' })
@Index('UQ_template_purchases_order_code', ['orderCode'], {
  unique: true,
})
@Index(
  'UQ_template_purchases_buyer_id_idempotency_key',
  ['buyerId', 'idempotencyKey'],
  { unique: true },
)
@Index('IDX_template_purchases_template_id', ['templateId'])
@Check(
  'CHK_template_purchases_amount',
  '"amount" > 0 AND "amount" <= 9007199254740991',
)
@Check('CHK_template_purchases_currency', '"currency" = \'VND\'')
@Check(
  'CHK_template_purchases_commission_rate_bps',
  '"commission_rate_bps" >= 0 AND "commission_rate_bps" <= 10000',
)
@Check(
  'CHK_template_purchases_platform_fee_amount',
  '"platform_fee_amount" >= 0 AND "platform_fee_amount" <= "amount"',
)
export class TemplatePurchaseOrmEntity {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  id!: string;

  @Column({ name: 'order_code', type: 'varchar', length: 34 })
  orderCode!: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId!: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId!: string;

  @Column({ name: 'published_version_id', type: 'uuid' })
  publishedVersionId!: string;

  // PostgreSQL bigint được đọc dưới dạng string
  @Column({ name: 'amount', type: 'bigint' })
  amount!: string;

  @Column({ name: 'currency', type: 'varchar', length: 3 })
  currency!: string;

  @Column({ name: 'commission_rate_bps', type: 'integer', default: 0 })
  commissionRateBps!: number;

  @Column({ name: 'platform_fee_amount', type: 'bigint', default: 0 })
  platformFeeAmount!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 255 })
  idempotencyKey!: string;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status!: TemplatePurchaseStatus;

  @Column({
    name: 'provider',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  provider!: TemplatePurchaseProvider | null;

  @Column({ name: 'entitlement_id', type: 'uuid', nullable: true })
  entitlementId!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
