import { Plan } from 'src/modules/billing/domain/entities/plan.entity';
import { Feature } from 'src/modules/features/domain/entities/feature.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plan_features')
@Index(['planId', 'featureId'], { unique: true })
@Index(['planId'])
@Index(['featureId'])
@Index(['enabled'])
export class PlanFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ name: 'feature_id', type: 'uuid' })
  featureId: string;

  @ManyToOne(() => Feature, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
