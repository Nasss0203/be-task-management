import { randomUUID } from 'crypto';

export type TeamspaceInviteLinkStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'EXHAUSTED';

export class TeamspaceInviteLink {
  private constructor(
    private readonly id: string,
    private readonly teamspaceId: string,
    private readonly tokenHash: string,
    private readonly createdBy: string | null,
    private readonly expiresAt: Date,
    private readonly maxUses: number | null,
    private useCount: number,
    private revokedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: {
    teamspaceId: string;
    tokenHash: string;
    createdBy: string;
    expiresAt: Date;
    maxUses: number | null;
  }): TeamspaceInviteLink {
    const now = new Date();
    return new TeamspaceInviteLink(
      randomUUID(), params.teamspaceId, params.tokenHash, params.createdBy,
      params.expiresAt, params.maxUses, 0, null, now, now,
    );
  }

  static restore(params: {
    id: string;
    teamspaceId: string;
    tokenHash: string;
    createdBy: string | null;
    expiresAt: Date;
    maxUses: number | null;
    useCount: number;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): TeamspaceInviteLink {
    return new TeamspaceInviteLink(
      params.id, params.teamspaceId, params.tokenHash, params.createdBy,
      params.expiresAt, params.maxUses, params.useCount, params.revokedAt,
      params.createdAt, params.updatedAt,
    );
  }

  getId(): string { return this.id; }
  getTeamspaceId(): string { return this.teamspaceId; }
  getTokenHash(): string { return this.tokenHash; }
  getCreatedBy(): string | null { return this.createdBy; }
  getExpiresAt(): Date { return this.expiresAt; }
  getMaxUses(): number | null { return this.maxUses; }
  getUseCount(): number { return this.useCount; }
  getRevokedAt(): Date | null { return this.revokedAt; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  isRevoked(): boolean { return this.revokedAt !== null; }
  isExpired(now = new Date()): boolean { return this.expiresAt <= now; }
  isExhausted(): boolean { return this.maxUses !== null && this.useCount >= this.maxUses; }

  getStatus(now = new Date()): TeamspaceInviteLinkStatus {
    if (this.isRevoked()) return 'REVOKED';
    if (this.isExpired(now)) return 'EXPIRED';
    if (this.isExhausted()) return 'EXHAUSTED';
    return 'ACTIVE';
  }

  canBeUsed(now = new Date()): boolean { return this.getStatus(now) === 'ACTIVE'; }

  recordSuccessfulUse(now = new Date()): void {
    if (!this.canBeUsed(now)) throw new Error('Invite link cannot be used');
    this.useCount += 1;
    this.updatedAt = now;
  }

  revoke(now = new Date()): void {
    if (this.revokedAt === null) {
      this.revokedAt = now;
      this.updatedAt = now;
    }
  }
}
