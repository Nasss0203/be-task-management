import { TeamspaceRole } from '../enums/teamspace-role.enum';

export class TeamspaceMember {
  constructor(
    private readonly id: string,
    private readonly teamspaceId: string,
    private readonly workspaceMemberId: string,
    private roleName: TeamspaceRole,
    private readonly joinedAt: Date,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: {
    teamspaceId: string;
    workspaceMemberId: string;
    roleName?: TeamspaceRole;
  }): TeamspaceMember {
    const now = new Date();

    return new TeamspaceMember(
      crypto.randomUUID(),
      params.teamspaceId,
      params.workspaceMemberId,
      params.roleName ?? TeamspaceRole.MEMBER,
      now,
      now,
      now,
    );
  }

  static restore(params: {
    id: string;
    teamspaceId: string;
    workspaceMemberId: string;
    roleName: TeamspaceRole;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): TeamspaceMember {
    return new TeamspaceMember(
      params.id,
      params.teamspaceId,
      params.workspaceMemberId,
      params.roleName,
      params.joinedAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getTeamspaceId(): string {
    return this.teamspaceId;
  }

  getWorkspaceMemberId(): string {
    return this.workspaceMemberId;
  }

  getRoleName(): TeamspaceRole {
    return this.roleName;
  }

  getJoinedAt(): Date {
    return this.joinedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  changeRole(roleName: TeamspaceRole): void {
    this.roleName = roleName;
    this.updatedAt = new Date();
  }
}
