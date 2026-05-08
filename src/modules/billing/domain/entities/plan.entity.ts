// src/modules/billing/domain/entities/plan.entity.ts

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanBillingInterval {
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  LIFETIME = 'LIFETIME',
}

@Entity('plans')
@Index(['slug'], { unique: true })
@Index(['isActive'])
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'price_amount', type: 'int', default: 0 })
  priceAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({
    name: 'billing_interval',
    type: 'enum',
    enum: PlanBillingInterval,
    default: PlanBillingInterval.MONTH,
  })
  billingInterval: PlanBillingInterval;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  limits: Record<string, unknown> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
