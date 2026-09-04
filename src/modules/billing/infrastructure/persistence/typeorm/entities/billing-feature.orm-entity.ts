import { BillingFeatureValueType } from 'src/modules/billing/domain/constants/billing-feature-value-type.constant';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('billing_features')
@Index('UQ_billing_features_code', ['code'], {
  unique: true,
})
export class BillingFeatureOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'enum',
    enum: BillingFeatureValueType,
  })
  value_type: BillingFeatureValueType;

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
