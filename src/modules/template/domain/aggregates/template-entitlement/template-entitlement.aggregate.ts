import { randomUUID } from 'crypto';

import { TemplateEntitlementSource } from '../../enums/template-entitlement-source.enum';

export type CreateTemplateEntitlementParams = {
  id?: string;
  templateId: string;
  userId: string;
  source?: TemplateEntitlementSource;
  createdAt?: Date;
};

export type RestoreTemplateEntitlementParams = {
  id: string;
  templateId: string;
  userId: string;
  source: TemplateEntitlementSource;
  createdAt: Date;
};

export class TemplateEntitlementAggregate {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private readonly userId: string,
    private readonly source: TemplateEntitlementSource,
    private readonly createdAt: Date,
  ) {
    if (!templateId.trim()) {
      throw new Error('Template id is required');
    }
    if (!userId.trim()) {
      throw new Error('User id is required');
    }
  }

  static create(
    params: CreateTemplateEntitlementParams,
  ): TemplateEntitlementAggregate {
    const now = new Date();

    return new TemplateEntitlementAggregate(
      params.id ?? randomUUID(),
      params.templateId,
      params.userId,
      params.source ?? TemplateEntitlementSource.FREE_CLAIM,
      params.createdAt ?? now,
    );
  }

  static restore(
    params: RestoreTemplateEntitlementParams,
  ): TemplateEntitlementAggregate {
    return new TemplateEntitlementAggregate(
      params.id,
      params.templateId,
      params.userId,
      params.source,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateId(): string {
    return this.templateId;
  }

  getUserId(): string {
    return this.userId;
  }

  getSource(): TemplateEntitlementSource {
    return this.source;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}

export { TemplateEntitlementAggregate as TemplateEntitlement };
