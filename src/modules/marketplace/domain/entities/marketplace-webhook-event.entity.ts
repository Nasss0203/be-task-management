import { randomUUID } from 'node:crypto';

import { MarketplaceWebhookStatus } from '../constants/marketplace-webhook-status.constant';

export interface CreateMarketplaceWebhookEventParams {
  id?: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt?: Date;
}

export interface ReconstituteMarketplaceWebhookEventParams {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: MarketplaceWebhookStatus;
  processedAt: Date | null;
  createdAt: Date;
}

export class MarketplaceWebhookEvent {
  private constructor(
    private readonly id: string,
    private readonly provider: string,
    private readonly providerEventId: string,
    private readonly eventType: string,
    private readonly payload: Record<string, unknown>,
    private status: MarketplaceWebhookStatus,
    private processedAt: Date | null,
    private readonly createdAt: Date,
  ) {}

  static create(
    params: CreateMarketplaceWebhookEventParams,
  ): MarketplaceWebhookEvent {
    const provider = params.provider.trim().toUpperCase();
    const providerEventId = params.providerEventId.trim();
    const eventType = params.eventType.trim();

    if (!provider) {
      throw new Error('Webhook provider is required');
    }

    if (!providerEventId) {
      throw new Error('Webhook provider event ID is required');
    }

    if (!eventType) {
      throw new Error('Webhook event type is required');
    }

    return new MarketplaceWebhookEvent(
      params.id ?? randomUUID(),
      provider,
      providerEventId,
      eventType,
      params.payload,
      MarketplaceWebhookStatus.PENDING,
      null,
      params.createdAt ?? new Date(),
    );
  }

  static reconstitute(
    params: ReconstituteMarketplaceWebhookEventParams,
  ): MarketplaceWebhookEvent {
    return new MarketplaceWebhookEvent(
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
    this.status = MarketplaceWebhookStatus.PROCESSED;
    this.processedAt = processedAt;
  }

  markFailed(processedAt = new Date()): void {
    this.status = MarketplaceWebhookStatus.FAILED;
    this.processedAt = processedAt;
  }

  markIgnored(processedAt = new Date()): void {
    this.status = MarketplaceWebhookStatus.IGNORED;
    this.processedAt = processedAt;
  }

  markReconciliationRequired(processedAt = new Date()): void {
    this.status = MarketplaceWebhookStatus.RECONCILIATION_REQUIRED;
    this.processedAt = processedAt;
  }

  getId(): string {
    return this.id;
  }

  getProvider(): string {
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

  getStatus(): MarketplaceWebhookStatus {
    return this.status;
  }

  getProcessedAt(): Date | null {
    return this.processedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
