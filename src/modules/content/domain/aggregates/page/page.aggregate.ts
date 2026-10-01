export class Page {
  constructor(
    private readonly id: string,
    private workspaceId: string,
    private title: string,
    private slug: string | null,
    private icon: string | null,
    private coverUrl: string | null,
    private teamspaceId: string | null,

    private parentPageId: string | null,
    private publicSubdomain: string | null,

    private createdBy: string,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
    private deletedBy: string | null = null,
  ) {}

  static create(params: {
    workspaceId: string;
    title: string;
    createdBy: string;
    slug?: string | null;
    icon?: string | null;
    coverUrl?: string | null;
    teamspaceId?: string | null;

    parentPageId?: string | null;
    publicSubdomain?: string | null;
  }): Page {
    return new Page(
      crypto.randomUUID(),
      params.workspaceId,
      params.title,
      params.slug ?? null,
      params.icon ?? null,
      params.coverUrl ?? null,
      params.teamspaceId ?? null,

      params.parentPageId ?? null,
      params.publicSubdomain ?? null,

      params.createdBy,
      new Date(),
      new Date(),
    );
  }

  static restore(params: {
    id: string;
    workspaceId: string;
    title: string;
    slug: string | null;
    icon: string | null;
    coverUrl: string | null;
    teamspaceId: string | null;

    parentPageId: string | null;
    publicSubdomain?: string | null;

    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    deletedBy: string | null;
  }): Page {
    return new Page(
      params.id,
      params.workspaceId,
      params.title,
      params.slug,
      params.icon,
      params.coverUrl,
      params.teamspaceId,

      params.parentPageId,
      params.publicSubdomain ?? null,

      params.createdBy,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
      params.deletedBy,
    );
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getTeamspaceId(): string | null {
    return this.teamspaceId;
  }

  getParentPageId(): string | null {
    return this.parentPageId;
  }

  getPublicSubdomain(): string | null {
    return this.publicSubdomain;
  }

  setPublicSubdomain(subdomain: string | null): void {
    this.publicSubdomain = subdomain;
    this.updatedAt = new Date();
  }

  getTitle(): string {
    return this.title;
  }

  getSlug(): string | null {
    return this.slug;
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

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  getDeletedBy(): string | null {
    return this.deletedBy;
  }

  update(params: {
    title?: string;
    slug?: string | null;
    icon?: string | null;
    coverUrl?: string | null;
  }): void {
    if (params.title !== undefined) {
      this.title = params.title;
    }

    if (params.slug !== undefined) {
      this.slug = params.slug;
    }

    if (params.icon !== undefined) {
      this.icon = params.icon;
    }

    if (params.coverUrl !== undefined) {
      this.coverUrl = params.coverUrl;
    }

    this.updatedAt = new Date();
  }

  markAsDeleted(deletedBy: string): void {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.updatedAt = new Date();
  }

  restoreDeleted(): void {
    this.deletedAt = null;
    this.deletedBy = null;
    this.updatedAt = new Date();
  }
}
