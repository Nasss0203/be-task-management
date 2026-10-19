import { User } from 'src/modules/identity/identity.types';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('marketplace_commission_rates')
@Index('IDX_marketplace_commission_rates_created_at', ['createdAt'])
@Check(
  'CHK_marketplace_commission_rates_rate_bps',
  '"rate_bps" >= 0 AND "rate_bps" <= 10000',
)
export class MarketplaceCommissionRateOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_marketplace_commission_rates',
  })
  id: string;

  @Column({ name: 'rate_bps', type: 'integer' })
  rateBps: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'created_by',
    foreignKeyConstraintName: 'FK_marketplace_commission_rates_created_by',
  })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
