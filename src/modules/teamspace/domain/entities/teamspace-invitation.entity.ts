import { randomUUID } from 'crypto';
import { TeamspaceInvitationStatus } from '../enums/teamspace-invitation-status.enum';

export class TeamspaceInvitation {
  private constructor(
    private readonly id: string,
    private readonly teamspaceId: string,
    private readonly workspaceMemberId: string,
    private readonly invitedBy: string | null,
    private status: TeamspaceInvitationStatus,
    private expiresAt: Date,
    private acceptedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: {
    teamspaceId: string;
    workspaceMemberId: string;
    invitedBy: string;
    expiresAt: Date;
  }): TeamspaceInvitation {
    const now = new Date();
    return new TeamspaceInvitation(
      randomUUID(),
      params.teamspaceId,
      params.workspaceMemberId,
      params.invitedBy,
      TeamspaceInvitationStatus.PENDING,
      params.expiresAt,
      null,
      now,
      now,
    );
  }

  static restore(params: {
    id: string;
    teamspaceId: string;
    workspaceMemberId: string;
    invitedBy: string | null;
    status: TeamspaceInvitationStatus;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): TeamspaceInvitation {
    return new TeamspaceInvitation(
      params.id,
      params.teamspaceId,
      params.workspaceMemberId,
      params.invitedBy,
      params.status,
      params.expiresAt,
      params.acceptedAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string { return this.id; }
  getTeamspaceId(): string { return this.teamspaceId; }
  getWorkspaceMemberId(): string { return this.workspaceMemberId; }
  getInvitedBy(): string | null { return this.invitedBy; }
  getStatus(): TeamspaceInvitationStatus { return this.status; }
  getExpiresAt(): Date { return this.expiresAt; }
  getAcceptedAt(): Date | null { return this.acceptedAt; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  getEffectiveStatus(now = new Date()): TeamspaceInvitationStatus {
    return this.status === TeamspaceInvitationStatus.PENDING &&
      this.expiresAt <= now
      ? TeamspaceInvitationStatus.EXPIRED
      : this.status;
  }

  isExpired(now = new Date()): boolean {
    return this.getEffectiveStatus(now) === TeamspaceInvitationStatus.EXPIRED;
  }

  canAccept(now = new Date()): boolean {
    return this.getEffectiveStatus(now) === TeamspaceInvitationStatus.PENDING;
  }

  accept(now = new Date()): void {
    this.ensurePending(now);
    this.status = TeamspaceInvitationStatus.ACCEPTED;
    this.acceptedAt = now;
    this.updatedAt = now;
  }

  decline(now = new Date()): void {
    this.ensurePending(now);
    this.status = TeamspaceInvitationStatus.DECLINED;
    this.updatedAt = now;
  }

  expire(now = new Date()): void {
    if (this.status !== TeamspaceInvitationStatus.PENDING || !this.isExpired(now)) {
      throw new Error('Invitation is not expired');
    }
    this.status = TeamspaceInvitationStatus.EXPIRED;
    this.updatedAt = now;
  }

  revoke(now = new Date()): void {
    this.ensurePending(now);
    this.status = TeamspaceInvitationStatus.REVOKED;
    this.updatedAt = now;
  }

  renew(expiresAt: Date, now = new Date()): void {
    this.ensurePending(now);
    if (expiresAt <= now) throw new Error('Invitation expiration must be in the future');
    this.expiresAt = expiresAt;
    this.updatedAt = now;
  }

  private ensurePending(now: Date): void {
    if (this.getEffectiveStatus(now) !== TeamspaceInvitationStatus.PENDING) {
      throw new Error('Invitation is no longer pending');
    }
  }
}
