import { randomUUID } from 'node:crypto';

import { BillingProvider } from '../constants/billing-provider.constant';
import { BillingWebhookStatus } from '../constants/billing-webhook-status.constant';

export interface CreateBillingWebhookEventParams {
  id?: string;
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt?: Date;
}

export interface ReconstituteBillingWebhookEventParams {
  id: string;
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: BillingWebhookStatus;
  processedAt: Date | null;
  createdAt: Date;
}

export class BillingWebhookEvent {
  private constructor(
    private readonly id: string,
    private readonly provider: BillingProvider,
    private readonly providerEventId: string,
    private readonly eventType: string,
    private readonly payload: Record<string, unknown>,
    private status: BillingWebhookStatus,
    private processedAt: Date | null,
    private readonly createdAt: Date,
  ) {}

  static create(params: CreateBillingWebhookEventParams): BillingWebhookEvent {
    const providerEventId = params.providerEventId.trim();
    const eventType = params.eventType.trim();

    if (!providerEventId) {
      throw new Error('Webhook provider event ID is required');
    }

    if (!eventType) {
      throw new Error('Webhook event type is required');
    }

    return new BillingWebhookEvent(
      params.id ?? randomUUID(),
      params.provider,
      providerEventId,
      eventType,
      params.payload,
      BillingWebhookStatus.PENDING,
      null,
      params.createdAt ?? new Date(),
    );
  }

  static reconstitute(
    params: ReconstituteBillingWebhookEventParams,
  ): BillingWebhookEvent {
    return new BillingWebhookEvent(
      params.id,
      params.provider,
      params.providerEventId,
      params.eventType,
      params.payload,
      params.status,
      params.processedAt,
      params.createdAt,
    );
  }

  markProcessed(processedAt = new Date()): void {
    this.status = BillingWebhookStatus.PROCESSED;
    this.processedAt = processedAt;
  }

  markFailed(processedAt = new Date()): void {
    this.status = BillingWebhookStatus.FAILED;
    this.processedAt = processedAt;
  }

  markIgnored(processedAt = new Date()): void {
    this.status = BillingWebhookStatus.IGNORED;
    this.processedAt = processedAt;
  }

  getId(): string {
    return this.id;
  }

  getProvider(): BillingProvider {
    return this.provider;
  }

  getProviderEventId(): string {
    return this.providerEventId;
  }

  getEventType(): string {
    return this.eventType;
  }

  getPayload(): Record<string, unknown> {
    return this.payload;
  }

  getStatus(): BillingWebhookStatus {
    return this.status;
  }

  getProcessedAt(): Date | null {
    return this.processedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
