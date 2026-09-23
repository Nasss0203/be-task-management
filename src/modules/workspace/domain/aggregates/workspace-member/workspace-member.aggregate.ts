import { randomUUID } from 'crypto';
import { WorkspaceMembershipType } from '../../enums/workspace-membership-type.enum';
import { WorkspaceRole } from '../../enums/workspace-role.enum';

type CreateWorkspaceMemberParams = {
  id?: string;
  workspaceId: string;
  userId: string;
  role?: WorkspaceRole;
  joinedAt?: Date;
  lastOpenedAt?: Date | null;
};

type CreateWorkspaceGuestParams = Omit<CreateWorkspaceMemberParams, 'role'>;

type RestoreWorkspaceMemberParams = {
  id: string;
  workspaceId: string;
  userId: string;
  membershipType: WorkspaceMembershipType;
  role: WorkspaceRole | null;
  joinedAt: Date;
  lastOpenedAt: Date | null;
};

export class WorkspaceMember {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly userId: string,
    private membershipType: WorkspaceMembershipType,
    private role: WorkspaceRole | null,
    private readonly joinedAt: Date,
    private lastOpenedAt: Date | null,
  ) {
    WorkspaceMember.assertValidMembership(membershipType, role);
  }

  static create(params: CreateWorkspaceMemberParams): WorkspaceMember {
    return WorkspaceMember.createMember(params);
  }

  /**
   * Tạo membership dạng Member với WorkspaceRole bắt buộc.
   */
  static createMember(params: CreateWorkspaceMemberParams): WorkspaceMember {
    return new WorkspaceMember(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.userId,
      WorkspaceMembershipType.MEMBER,
      params.role ?? WorkspaceRole.MEMBER,
      params.joinedAt ?? new Date(),
      params.lastOpenedAt ?? null,
    );
  }

  /**
   * Tạo membership dạng Guest.
   * Guest không có WorkspaceRole và chỉ nhận quyền từ PageShare.
   */
  static createGuest(params: CreateWorkspaceGuestParams): WorkspaceMember {
    return new WorkspaceMember(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.userId,
      WorkspaceMembershipType.GUEST,
      null,
      params.joinedAt ?? new Date(),
      params.lastOpenedAt ?? null,
    );
  }

  static restore(params: RestoreWorkspaceMemberParams): WorkspaceMember {
    return new WorkspaceMember(
      params.id,
      params.workspaceId,
      params.userId,
      params.membershipType,
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

  getMembershipType(): WorkspaceMembershipType {
    return this.membershipType;
  }

  getRole(): WorkspaceRole | null {
    return this.role;
  }

  getJoinedAt(): Date {
    return this.joinedAt;
  }

  getLastOpenedAt(): Date | null {
    return this.lastOpenedAt;
  }

  changeRole(role: WorkspaceRole): void {
    if (this.isGuest()) {
      throw new Error('Guest membership cannot have a workspace role');
    }

    this.role = role;
  }

  /**
   * Nâng Guest thành Workspace Member trên cùng membership record.
   */
  promoteToMember(role: WorkspaceRole): void {
    this.membershipType = WorkspaceMembershipType.MEMBER;
    this.role = role;
  }

  isMember(): boolean {
    return this.membershipType === WorkspaceMembershipType.MEMBER;
  }

  isGuest(): boolean {
    return this.membershipType === WorkspaceMembershipType.GUEST;
  }

  markOpened(openedAt: Date): void {
    this.lastOpenedAt = openedAt;
  }

  private static assertValidMembership(
    membershipType: WorkspaceMembershipType,
    role: WorkspaceRole | null,
  ): void {
    if (membershipType === WorkspaceMembershipType.GUEST && role !== null) {
      throw new Error('Guest membership cannot have a workspace role');
    }

    if (membershipType === WorkspaceMembershipType.MEMBER && role === null) {
      throw new Error('Member membership requires a workspace role');
    }
  }
}

type RestoreWorkspaceMemberDetailParams = {
  id: string;
  workspaceId: string;
  userId: string;
  fullName: string;
  email: string;
  membershipType: WorkspaceMembershipType;
  role: WorkspaceRole | null;
  avatarUrl?: string | null;
  lastOpenedAt?: Date | null;
  joinedAt: Date;
};

export class WorkspaceMemberDetail {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly userId: string,
    private readonly fullName: string,
    private readonly email: string,
    private readonly membershipType: WorkspaceMembershipType,
    private readonly role: WorkspaceRole | null,
    private readonly avatarUrl: string | null,
    private readonly lastOpenedAt: Date | null,
    private readonly joinedAt: Date,
  ) {}

  static restore(params: RestoreWorkspaceMemberDetailParams) {
    return new WorkspaceMemberDetail(
      params.id,
      params.workspaceId,
      params.userId,
      params.fullName,
      params.email,
      params.membershipType,
      params.role,
      params.avatarUrl ?? null,
      params.lastOpenedAt ?? null,
      params.joinedAt,
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

  getMembershipType(): WorkspaceMembershipType {
    return this.membershipType;
  }

  getRole(): WorkspaceRole | null {
    return this.role;
  }

  getAvatarUrl(): string | null {
    return this.avatarUrl;
  }

  getLastOpenedAt(): Date | null {
    return this.lastOpenedAt;
  }

  getJoinedAt(): Date {
    return this.joinedAt;
  }
}
