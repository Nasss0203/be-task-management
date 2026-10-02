import { randomUUID } from 'crypto';

import { TemplateVersionStatus } from '../../enums/template-version-status.enum';

export type CreateTemplateVersionParams = {
  id?: string;
  templateId: string;
  versionNumber: number;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RestoreTemplateVersionParams = {
  id: string;
  templateId: string;
  versionNumber: number;
  status: TemplateVersionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export class TemplateVersionAggregate {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private readonly versionNumber: number,
    private status: TemplateVersionStatus,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private publishedAt: Date | null,
  ) {
    if (!templateId.trim()) throw new Error('Template id is required');
    if (versionNumber <= 0)
      throw new Error('Version number must be greater than zero');
  }

  static create(params: CreateTemplateVersionParams): TemplateVersionAggregate {
    const now = new Date();
    return new TemplateVersionAggregate(
      params.id ?? randomUUID(),
      params.templateId,
      params.versionNumber,
      TemplateVersionStatus.DRAFT,
      params.createdBy,
      params.createdAt ?? now,
      params.updatedAt ?? now,
      null,
    );
  }

  static restore(
    params: RestoreTemplateVersionParams,
  ): TemplateVersionAggregate {
    return new TemplateVersionAggregate(
      params.id,
      params.templateId,
      params.versionNumber,
      params.status,
      params.createdBy,
      params.createdAt,
      params.updatedAt,
      params.publishedAt,
    );
  }

  getId(): string {
    return this.id;
  }
  getTemplateId(): string {
    return this.templateId;
  }
  getVersionNumber(): number {
    return this.versionNumber;
  }
  getStatus(): TemplateVersionStatus {
    return this.status;
  }
  getCreatedBy(): string {
    return this.createdBy;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getPublishedAt(): Date | null {
    return this.publishedAt;
  }

  publish(): void {
    if (this.status !== TemplateVersionStatus.DRAFT) {
      throw new Error('Only draft template versions can be published');
    }
    this.status = TemplateVersionStatus.PUBLISHED;
    this.publishedAt = new Date();
    this.updatedAt = new Date();
  }

  isDraft(): boolean {
    return this.status === TemplateVersionStatus.DRAFT;
  }
  isPublished(): boolean {
    return this.status === TemplateVersionStatus.PUBLISHED;
  }
  ensureEditable(): void {
    if (!this.isDraft()) {
      throw new Error('Published template version cannot be modified');
    }
  }

  ensureUsable(): void {
    if (!this.isPublished()) {
      throw new Error('Only published template versions can be used');
    }
  }
}

export { TemplateVersionAggregate as TemplateVersion };
