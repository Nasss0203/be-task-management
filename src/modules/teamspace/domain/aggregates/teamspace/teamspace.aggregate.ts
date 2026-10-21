import { TeamspaceVisibility } from '../../enums/teamspace-visibility.enum';

export class Teamspace {
  constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private name: string,
    private slug: string,
    private description: string | null,
    private icon: string | null,
    private visibility: TeamspaceVisibility,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
    private deletedBy: string | null = null,
  ) {}

  static create(params: {
    workspaceId: string;
    name: string;
    slug: string;
    createdBy: string;
    description?: string | null;
    icon?: string | null;
    visibility?: TeamspaceVisibility;
  }): Teamspace {
    return new Teamspace(
      crypto.randomUUID(),
      params.workspaceId,
      params.name,
      params.slug,
      params.description ?? null,
      params.icon ?? null,
      params.visibility ?? TeamspaceVisibility.OPEN,
      params.createdBy,
      new Date(),
      new Date(),
      null,
      null,
    );
  }

  static restore(params: {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    visibility: TeamspaceVisibility;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    deletedBy: string | null;
  }): Teamspace {
    return new Teamspace(
      params.id,
      params.workspaceId,
      params.name,
      params.slug,
      params.description,
      params.icon,
      params.visibility,
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

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getDescription(): string | null {
    return this.description;
  }

  getIcon(): string | null {
    return this.icon;
  }

  getVisibility(): TeamspaceVisibility {
    return this.visibility;
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
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    visibility?: TeamspaceVisibility;
  }): void {
    if (params.name !== undefined) {
      this.name = params.name;
    }

    if (params.slug !== undefined) {
      this.slug = params.slug;
    }

    if (params.description !== undefined) {
      this.description = params.description;
    }

    if (params.icon !== undefined) {
      this.icon = params.icon;
    }

    if (params.visibility !== undefined) {
      this.visibility = params.visibility;
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
