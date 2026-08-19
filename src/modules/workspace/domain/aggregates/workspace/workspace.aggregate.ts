import { randomUUID } from 'crypto';
import { WorkspaceLayoutMode } from '../../enums/workspace-layout-mode.enum';
import { PlanTypeWorkspace } from '../../enums/workspace-plan-type.enum';

type CreateWorkspaceParams = {
  id?: string;
  name: string;
  slug: string;
  planType?: PlanTypeWorkspace;
  layoutMode?: WorkspaceLayoutMode;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdBy?: string | null;
};

type RestoreWorkspaceParams = {
  id: string;
  name: string;
  slug: string;
  planType: PlanTypeWorkspace;
  layoutMode: WorkspaceLayoutMode;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdBy: string | null;
};

export class Workspace {
  private constructor(
    private readonly id: string,
    private name: string,
    private readonly slug: string,
    private readonly planType: PlanTypeWorkspace,
    private layoutMode: WorkspaceLayoutMode,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
    private deletedBy: string | null,
    private readonly createdBy: string | null,
  ) {}

  static create(params: CreateWorkspaceParams): Workspace {
    const now = new Date();

    return new Workspace(
      params.id ?? randomUUID(),
      params.name,
      params.slug,
      params.planType ?? PlanTypeWorkspace.FREE,
      params.layoutMode ?? WorkspaceLayoutMode.TABS,
      params.createdAt ?? now,
      params.updatedAt ?? now,
      params.deletedAt ?? null,
      params.deletedBy ?? null,
      params.createdBy ?? null,
    );
  }

  static restore(params: RestoreWorkspaceParams): Workspace {
    return new Workspace(
      params.id,
      params.name,
      params.slug,
      params.planType,
      params.layoutMode,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
      params.deletedBy,
      params.createdBy,
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getPlanType(): PlanTypeWorkspace {
    return this.planType;
  }

  getLayoutMode(): WorkspaceLayoutMode {
    return this.layoutMode;
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

  getCreatedBy(): string | null {
    return this.createdBy;
  }

  rename(name: string): void {
    this.name = name;
    this.touch();
  }

  changeLayoutMode(layoutMode: WorkspaceLayoutMode): void {
    this.layoutMode = layoutMode;
    this.touch();
  }

  softDelete(deletedBy: string, deletedAt: Date): void {
    this.deletedBy = deletedBy;
    this.deletedAt = deletedAt;
    this.touch();
  }

  restore(): void {
    this.deletedBy = null;
    this.deletedAt = null;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
