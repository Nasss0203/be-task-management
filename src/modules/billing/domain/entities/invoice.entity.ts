import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

@Entity('invoices')
@Index(['userId'])
@Index(['planId'])
@Index(['subscriptionId'])
@Index(['invoiceNumber'], { unique: true })
@Index(['status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => Subscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription | null;

  @Column({
    name: 'invoice_number',
    type: 'varchar',
    length: 100,
  })
  invoiceNumber: string;

  @Column({ name: 'amount_due', type: 'int', default: 0 })
  amountDue: number;

  @Column({ name: 'amount_paid', type: 'int', default: 0 })
  amountPaid: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
  })
  status: InvoiceStatus;

  @Column({ name: 'period_start', type: 'timestamp', nullable: true })
  periodStart: Date | null;

  @Column({ name: 'period_end', type: 'timestamp', nullable: true })
  periodEnd: Date | null;

  @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true })
  hostedInvoiceUrl: string | null;

  @Column({ name: 'invoice_pdf_url', type: 'text', nullable: true })
  invoicePdfUrl: string | null;

  @Column({ name: 'due_at', type: 'timestamp', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
