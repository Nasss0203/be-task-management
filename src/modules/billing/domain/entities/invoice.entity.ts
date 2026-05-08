// src/modules/billing/domain/entities/invoice.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

@Entity('invoices')
@Index(['workspaceId'])
@Index(['subscriptionId'])
@Index(['invoiceNumber'], { unique: true })
@Index(['status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @Column({
    name: 'invoice_number',
    type: 'varchar',
    length: 100,
    unique: true,
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
