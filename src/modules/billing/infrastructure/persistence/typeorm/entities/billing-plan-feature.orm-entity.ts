import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('billing_plan_features')
@Unique('UQ_billing_plan_features_plan_feature', ['plan_id', 'feature_id'])
@Index('IDX_billing_plan_features_plan_id', ['plan_id'])
@Index('IDX_billing_plan_features_feature_id', ['feature_id'])
export class BillingPlanFeatureOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  plan_id: string;

  @Column({
    type: 'uuid',
  })
  feature_id: string;

  /**
   * Ví dụ:
   *
   * true
   * false
   * 10
   * 500000
   * "unlimited"
   */
  @Column({
    type: 'jsonb',
  })
  value: boolean | number | string | null;

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
