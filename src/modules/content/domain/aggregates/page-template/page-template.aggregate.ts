import {
  TemplateStatus,
  TemplateVisibility,
} from 'src/common/enum/template.enum';

export class PageTemplate {
  constructor(
    private readonly id: string,
    private workspaceId: string | null,
    private name: string,
    private description: string | null,
    private icon: string | null,
    private coverUrl: string | null,
    private category: string | null,
    private isSystem: boolean,
    private createdBy: string | null,
    private status: TemplateStatus,
    private visibility: TemplateVisibility,
    private useCount: number,
    private likesCount: number,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {}

  static restore(params: {
    id: string;
    workspaceId: string | null;
    name: string;
    description: string | null;
    icon: string | null;
    coverUrl: string | null;
    category: string | null;
    isSystem: boolean;
    createdBy: string | null;
    status: TemplateStatus;
    visibility: TemplateVisibility;
    useCount: number;
    likesCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): PageTemplate {
    return new PageTemplate(
      params.id,
      params.workspaceId,
      params.name,
      params.description,
      params.icon,
      params.coverUrl,
      params.category,
      params.isSystem,
      params.createdBy,
      params.status,
      params.visibility,
      params.useCount,
      params.likesCount,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
    );
  }

  static create(params: {
    name: string;
    workspaceId?: string | null;
    description?: string | null;
    icon?: string | null;
    coverUrl?: string | null;
    category?: string | null;
    isSystem?: boolean;
    createdBy?: string | null;
    status?: TemplateStatus;
    visibility?: TemplateVisibility;
  }): PageTemplate {
    return new PageTemplate(
      crypto.randomUUID(),
      params.workspaceId ?? null,
      params.name,
      params.description ?? null,
      params.icon ?? null,
      params.coverUrl ?? null,
      params.category ?? null,
      params.isSystem ?? false,
      params.createdBy ?? null,
      params.status ?? TemplateStatus.DRAFT,
      params.visibility ?? TemplateVisibility.PRIVATE,
      0,
      0,
      new Date(),
      new Date(),
    );
  }

  getId(): string {
    return this.id;
  }
  getWorkspaceId(): string | null {
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
  getCategory(): string | null {
    return this.category;
  }
  getIsSystem(): boolean {
    return this.isSystem;
  }
  getCreatedBy(): string | null {
    return this.createdBy;
  }
  getStatus(): TemplateStatus {
    return this.status;
  }
  getVisibility(): TemplateVisibility {
    return this.visibility;
  }
  getUseCount(): number {
    return this.useCount;
  }
  getLikesCount(): number {
    return this.likesCount;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  update(params: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    coverUrl?: string | null;
    category?: string | null;
    status?: TemplateStatus;
    visibility?: TemplateVisibility;
  }) {
    if (params.name !== undefined) this.name = params.name;
    if (params.description !== undefined) this.description = params.description;
    if (params.icon !== undefined) this.icon = params.icon;
    if (params.coverUrl !== undefined) this.coverUrl = params.coverUrl;
    if (params.category !== undefined) this.category = params.category;
    if (params.status !== undefined) this.status = params.status;
    if (params.visibility !== undefined) this.visibility = params.visibility;
    this.updatedAt = new Date();
  }

  markAsDeleted() {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }
}
