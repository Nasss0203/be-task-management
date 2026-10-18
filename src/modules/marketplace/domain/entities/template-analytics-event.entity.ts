import { randomUUID } from 'node:crypto';

import { TemplateAnalyticsEventType } from '../enums/template-analytics-event-type.enum';

export interface CreateTemplateAnalyticsEventParams {
  id?: string;
  templateId: string;
  versionId?: string | null;
  eventType: TemplateAnalyticsEventType;
  userId?: string | null;
  /** USE only: the page created by the successful clone; the idempotency key. */
  sourceId?: string | null;
  createdAt?: Date;
}

export interface ReconstituteTemplateAnalyticsEventParams {
  id: string;
  templateId: string;
  versionId: string | null;
  eventType: TemplateAnalyticsEventType;
  userId: string | null;
  sourceId: string | null;
  createdAt: Date;
}

/** Append-only fact; it has no state transitions after creation. */
export class TemplateAnalyticsEvent {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private readonly versionId: string | null,
    private readonly eventType: TemplateAnalyticsEventType,
    private readonly userId: string | null,
    private readonly sourceId: string | null,
    private readonly createdAt: Date,
  ) {}

  static create(
    params: CreateTemplateAnalyticsEventParams,
  ): TemplateAnalyticsEvent {
    const templateId = params.templateId?.trim();
    const versionId = params.versionId?.trim() || null;
    const userId = params.userId?.trim() || null;
    const sourceId = params.sourceId?.trim() || null;

    if (!templateId) {
      throw new Error('Template analytics event template ID is required');
    }

    if (!Object.values(TemplateAnalyticsEventType).includes(params.eventType)) {
      throw new Error(
        `Unsupported template analytics event type: ${String(params.eventType)}`,
      );
    }

    if (params.eventType === TemplateAnalyticsEventType.USE) {
      if (!sourceId) {
        throw new Error('Template USE event requires a source ID');
      }

      if (!versionId) {
        throw new Error('Template USE event requires a version ID');
      }
    } else if (sourceId) {
      throw new Error('Template VIEW event cannot have a source ID');
    }

    return new TemplateAnalyticsEvent(
      params.id ?? randomUUID(),
      templateId,
      versionId,
      params.eventType,
      userId,
      sourceId,
      params.createdAt ?? new Date(),
    );
  }

  static reconstitute(
    params: ReconstituteTemplateAnalyticsEventParams,
  ): TemplateAnalyticsEvent {
    return new TemplateAnalyticsEvent(
      params.id,
      params.templateId,
      params.versionId,
      params.eventType,
      params.userId,
      params.sourceId,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateId(): string {
    return this.templateId;
  }

  getVersionId(): string | null {
    return this.versionId;
  }

  getEventType(): TemplateAnalyticsEventType {
    return this.eventType;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getSourceId(): string | null {
    return this.sourceId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
