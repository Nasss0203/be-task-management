import { randomUUID } from 'crypto';
import { WorkspaceRole } from '../../enums/workspace-role.enum';
import { WorkspaceInviteStatus } from '../../enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from '../../enums/workspace-invite-type.enum';

type CreateWorkspaceInviteParams = {
  id?: string;
  workspaceId: string;
  userId?: string | null;
  email?: string | null;
  type: WorkspaceInviteType;
  roleName: WorkspaceRole;
  invitedBy: string;
  token?: string;
  status?: WorkspaceInviteStatus;
  acceptedAt?: Date | null;
  expiresAt: Date;
  maxUses?: number | null;
  usedCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type RestoreWorkspaceInviteParams = Required<
  Pick<
    CreateWorkspaceInviteParams,
    | 'id'
    | 'workspaceId'
    | 'type'
    | 'roleName'
    | 'invitedBy'
    | 'token'
    | 'status'
    | 'expiresAt'
    | 'usedCount'
    | 'createdAt'
    | 'updatedAt'
  >
> &
  Pick<
    CreateWorkspaceInviteParams,
    'userId' | 'email' | 'acceptedAt' | 'maxUses'
  >;

export class WorkspaceInvite {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private userId: string | null,
    private readonly email: string | null,
    private readonly type: WorkspaceInviteType,
    private readonly roleName: WorkspaceRole,
    private readonly invitedBy: string,
    private readonly token: string,
    private status: WorkspaceInviteStatus,
    private acceptedAt: Date | null,
    private readonly expiresAt: Date,
    private readonly maxUses: number | null,
    private usedCount: number,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: CreateWorkspaceInviteParams): WorkspaceInvite {
    const now = new Date();

    return new WorkspaceInvite(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.userId ?? null,
      params.email ?? null,
      params.type,
      params.roleName,
      params.invitedBy,
      params.token ?? randomUUID(),
      params.status ?? WorkspaceInviteStatus.PENDING,
      params.acceptedAt ?? null,
      params.expiresAt,
      params.maxUses ?? null,
      params.usedCount ?? 0,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(params: RestoreWorkspaceInviteParams): WorkspaceInvite {
    return new WorkspaceInvite(
      params.id,
      params.workspaceId,
      params.userId ?? null,
      params.email ?? null,
      params.type,
      params.roleName,
      params.invitedBy,
      params.token,
      params.status,
      params.acceptedAt ?? null,
      params.expiresAt,
      params.maxUses ?? null,
      params.usedCount,
      params.createdAt,
      params.updatedAt,
    );
  }

  static createEmail(params: {
    workspaceId: string;
    userId: string | null;
    email: string;
    roleName: WorkspaceRole;
    invitedBy: string;
    expiresAt: Date;
  }): WorkspaceInvite {
    return WorkspaceInvite.create({
      workspaceId: params.workspaceId,
      userId: params.userId,
      email: params.email,
      type: WorkspaceInviteType.EMAIL,
      roleName: params.roleName,
      invitedBy: params.invitedBy,
      expiresAt: params.expiresAt,
      maxUses: 1,
      usedCount: 0,
    });
  }

  static createLink(params: {
    workspaceId: string;
    roleName: WorkspaceRole;
    invitedBy: string;
    expiresAt: Date;
    maxUses: number | null;
  }): WorkspaceInvite {
    return WorkspaceInvite.create({
      workspaceId: params.workspaceId,
      userId: null,
      email: null,
      type: WorkspaceInviteType.LINK,
      roleName: params.roleName,
      invitedBy: params.invitedBy,
      expiresAt: params.expiresAt,
      maxUses: params.maxUses,
      usedCount: 0,
    });
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getEmail(): string | null {
    return this.email;
  }

  getType(): WorkspaceInviteType {
    return this.type;
  }

  getRoleName(): WorkspaceRole {
    return this.roleName;
  }

  getInvitedBy(): string {
    return this.invitedBy;
  }

  getToken(): string {
    return this.token;
  }

  getStatus(): WorkspaceInviteStatus {
    return this.status;
  }

  getAcceptedAt(): Date | null {
    return this.acceptedAt;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getMaxUses(): number | null {
    return this.maxUses;
  }

  getUsedCount(): number {
    return this.usedCount;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  accept(userId: string, acceptedAt: Date): void {
    this.usedCount += 1;

    if (this.type === WorkspaceInviteType.EMAIL) {
      this.userId = userId;
      this.status = WorkspaceInviteStatus.ACCEPTED;
      this.acceptedAt = acceptedAt;
    }

    if (
      this.type === WorkspaceInviteType.LINK &&
      this.maxUses &&
      this.usedCount >= this.maxUses
    ) {
      this.status = WorkspaceInviteStatus.EXPIRED;
    }

    this.touch();
  }

  markRevoked(): void {
    this.status = WorkspaceInviteStatus.REVOKED;
    this.touch();
  }

  markDeclined(): void {
    this.status = WorkspaceInviteStatus.DECLINED;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
