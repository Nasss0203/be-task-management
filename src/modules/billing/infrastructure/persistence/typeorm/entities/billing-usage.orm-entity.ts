import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('billing_usage')
@Unique('UQ_billing_usage_workspace_feature_period', [
  'workspace_id',
  'feature_id',
  'period_start',
  'period_end',
])
@Index('IDX_billing_usage_workspace_id', ['workspace_id'])
@Index('IDX_billing_usage_feature_id', ['feature_id'])
export class BillingUsageOrmEntity {
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
  feature_id: string;

  @Column({
    type: 'timestamptz',
  })
  period_start: Date;

  @Column({
    type: 'timestamptz',
  })
  period_end: Date;

  @Column({
    type: 'bigint',
    default: '0',
  })
  used_value: string;

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
