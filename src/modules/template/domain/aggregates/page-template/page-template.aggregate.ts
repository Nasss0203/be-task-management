import { randomUUID } from 'crypto';

import { TemplateStatus } from '../../enums/template-status.enum';
import { TemplateVisibility } from '../../enums/template-visibility.enum';

export type CreatePageTemplateParams = {
  id?: string;
  sourcePageId: string | null;
  workspaceId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  coverUrl?: string | null;
  createdBy: string;
  visibility?: TemplateVisibility;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RestorePageTemplateParams = {
  id: string;
  sourcePageId: string | null;
  workspaceId: string;
  name: string;
  description: string | null;
  icon: string | null;
  coverUrl: string | null;
  createdBy: string;
  status: TemplateStatus;
  visibility: TemplateVisibility;
  createdAt: Date;
  updatedAt: Date;
};

export class PageTemplateAggregate {
  private constructor(
    private readonly id: string,
    private readonly sourcePageId: string | null,
    private readonly workspaceId: string,
    private name: string,
    private description: string | null,
    private icon: string | null,
    private coverUrl: string | null,
    private readonly createdBy: string,
    private status: TemplateStatus,
    private visibility: TemplateVisibility,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    this.validateName(name);
  }

  static create(params: CreatePageTemplateParams): PageTemplateAggregate {
    const now = new Date();

    return new PageTemplateAggregate(
      params.id ?? randomUUID(),
      params.sourcePageId ?? null,
      params.workspaceId,
      params.name,
      params.description ?? null,
      params.icon ?? null,
      params.coverUrl ?? null,
      params.createdBy,
      TemplateStatus.DRAFT,
      params.visibility ?? TemplateVisibility.PRIVATE,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(params: RestorePageTemplateParams): PageTemplateAggregate {
    return new PageTemplateAggregate(
      params.id,
      params.sourcePageId,
      params.workspaceId,
      params.name,
      params.description,
      params.icon,
      params.coverUrl,
      params.createdBy,
      params.status,
      params.visibility,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }
  getSourcePageId(): string | null {
    return this.sourcePageId;
  }
  getWorkspaceId(): string {
    return this.workspaceId;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string | null {
    return this.description;
  }
  getIcon(): string | null {
    return this.icon;
  }
  getCoverUrl(): string | null {
    return this.coverUrl;
  }
  getCreatedBy(): string {
    return this.createdBy;
  }
  getStatus(): TemplateStatus {
    return this.status;
  }
  getVisibility(): TemplateVisibility {
    return this.visibility;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateMetadata(params: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    coverUrl?: string | null;
    visibility?: TemplateVisibility;
  }): void {
    this.ensureNotArchived();

    if (params.name !== undefined) {
      this.validateName(params.name);
      this.name = params.name;
    }
    if (params.description !== undefined) this.description = params.description;
    if (params.icon !== undefined) this.icon = params.icon;
    if (params.coverUrl !== undefined) this.coverUrl = params.coverUrl;
    if (params.visibility !== undefined) this.visibility = params.visibility;
    this.updatedAt = new Date();
  }

  publish(): void {
    if (this.status === TemplateStatus.ARCHIVED) {
      throw new Error('Archived template cannot be published');
    }
    this.status = TemplateStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  unpublish(): void {
    if (this.status === TemplateStatus.PUBLISHED) {
      this.status = TemplateStatus.DRAFT;
      this.updatedAt = new Date();
    }
  }

  archive(): void {
    if (this.status !== TemplateStatus.ARCHIVED) {
      this.status = TemplateStatus.ARCHIVED;
      this.updatedAt = new Date();
    }
  }

  restoreArchived(): void {
    if (this.status === TemplateStatus.ARCHIVED) {
      this.status = TemplateStatus.DRAFT;
      this.updatedAt = new Date();
    }
  }

  private ensureNotArchived(): void {
    if (this.status === TemplateStatus.ARCHIVED) {
      throw new Error('Archived template metadata cannot be modified');
    }
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Template name is required');
    }
  }

  ensureCanCreateVersion(): void {
    if (this.status === TemplateStatus.ARCHIVED) {
      throw new Error('Archived template cannot create a new version');
    }
  }
}

export { PageTemplateAggregate as PageTemplate };
