import { randomUUID } from 'crypto';
import { WorkspaceRole } from '../../enums/workspace-role.enum';

type CreateWorkspaceMemberParams = {
  id?: string;
  workspaceId: string;
  userId: string;
  role?: WorkspaceRole;
  joinedAt?: Date;
  lastOpenedAt?: Date | null;
};

type RestoreWorkspaceMemberParams = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  lastOpenedAt: Date | null;
};

export class WorkspaceMember {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly userId: string,
    private role: WorkspaceRole,
    private readonly joinedAt: Date,
    private lastOpenedAt: Date | null,
  ) {}

  static create(params: CreateWorkspaceMemberParams): WorkspaceMember {
    return new WorkspaceMember(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.userId,
      params.role ?? WorkspaceRole.MEMBER,
      params.joinedAt ?? new Date(),
      params.lastOpenedAt ?? null,
    );
  }

  static restore(params: RestoreWorkspaceMemberParams): WorkspaceMember {
    return new WorkspaceMember(
      params.id,
      params.workspaceId,
      params.userId,
      params.role,
      params.joinedAt,
      params.lastOpenedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getUserId(): string {
    return this.userId;
  }

  getRole(): WorkspaceRole {
    return this.role;
  }

  getJoinedAt(): Date {
    return this.joinedAt;
  }

  getLastOpenedAt(): Date | null {
    return this.lastOpenedAt;
  }

  changeRole(role: WorkspaceRole): void {
    this.role = role;
  }

  markOpened(openedAt: Date): void {
    this.lastOpenedAt = openedAt;
  }
}

type RestoreWorkspaceMemberDetailParams = {
  id: string;
  workspaceId: string;
  userId: string;
  fullName: string;
  email: string;
  role: WorkspaceRole;
  avatarUrl?: string | null;
  lastOpenedAt?: Date | null;
  joinedAt: Date | null;
  taskCount?: number;
};

export class WorkspaceMemberDetail {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly userId: string,
    private readonly fullName: string,
    private readonly email: string,
    private readonly role: WorkspaceRole,
    private readonly avatarUrl: string | null,
    private readonly lastOpenedAt: Date | null,
    private readonly joinedAt: Date | null,
    private readonly taskCount: number,
  ) {}

  static restore(params: RestoreWorkspaceMemberDetailParams) {
    return new WorkspaceMemberDetail(
      params.id,
      params.workspaceId,
      params.userId,
      params.fullName,
      params.email,
      params.role,
      params.avatarUrl ?? null,
      params.lastOpenedAt ?? null,
      params.joinedAt,
      params.taskCount ?? 0,
    );
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getUserId(): string {
    return this.userId;
  }

  getFullName(): string {
    return this.fullName;
  }

  getEmail(): string {
    return this.email;
  }

  getRole(): WorkspaceRole {
    return this.role;
  }

  getAvatarUrl(): string | null {
    return this.avatarUrl;
  }

  getLastOpenedAt(): Date | null {
    return this.lastOpenedAt;
  }

  getJoinedAt(): Date | null {
    return this.joinedAt;
  }

  getTaskCount(): number {
    return this.taskCount;
  }
}
