import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';
import { OutboxModule } from 'src/shared/infrastructure/outbox/outbox.module';
import { AcceptTeamspaceInvitationHandler } from './application/commands/teamspace/accept-teamspace-invitation/accept-teamspace-invitation.handler';
import { AddTeamspaceMemberHandler } from './application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';
import { CreateTeamspaceInviteLinkHandler } from './application/commands/teamspace/create-teamspace-invite-link/create-teamspace-invite-link.handler';
import { CreateTeamspaceHandler } from './application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { DeclineTeamspaceInvitationHandler } from './application/commands/teamspace/decline-teamspace-invitation/decline-teamspace-invitation.handler';
import { InviteTeamspaceMemberHandler } from './application/commands/teamspace/invite-teamspace-member/invite-teamspace-member.handler';
import { JoinTeamspaceByLinkHandler } from './application/commands/teamspace/join-teamspace-by-link/join-teamspace-by-link.handler';
import { JoinTeamspaceHandler } from './application/commands/teamspace/join-teamspace/join-teamspace.handler';
import { LeaveTeamspaceHandler } from './application/commands/teamspace/leave-teamspace/leave-teamspace.handler';
import { RemoveTeamspaceMemberHandler } from './application/commands/teamspace/remove-teamspace-member/remove-teamspace-member.handler';
import { ResendTeamspaceInvitationHandler } from './application/commands/teamspace/resend-teamspace-invitation/resend-teamspace-invitation.handler';
import { RevokeTeamspaceInvitationHandler } from './application/commands/teamspace/revoke-teamspace-invitation/revoke-teamspace-invitation.handler';
import { RevokeTeamspaceInviteLinkHandler } from './application/commands/teamspace/revoke-teamspace-invite-link/revoke-teamspace-invite-link.handler';
import { UpdateTeamspaceJoinSettingsHandler } from './application/commands/teamspace/update-teamspace-join-settings/update-teamspace-join-settings.handler';
import { UpdateTeamspaceMemberRoleHandler } from './application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.handler';
import { UpdateTeamspaceHandler } from './application/commands/teamspace/update-teamspace/update-teamspace.handler';
import { ArchiveTeamspaceHandler } from './application/commands/teamspace/archive-teamspace/archive-teamspace.handler';
import { RestoreTeamspaceHandler } from './application/commands/teamspace/restore-teamspace/restore-teamspace.handler';
import { GetArchivedTeamspacesHandler } from './application/queries/teamspace/get-archived-teamspaces/get-archived-teamspaces.handler';
import { DiscoverTeamspacesHandler } from './application/queries/teamspace/discover-teamspaces/discover-teamspaces.handler';
import { GetMyTeamspaceInvitationsHandler } from './application/queries/teamspace/get-my-teamspace-invitations/get-my-teamspace-invitations.handler';
import { GetTeamspaceMembersHandler } from './application/queries/teamspace/get-teamspace-members/get-teamspace-members.handler';
import { GetTeamspacesHandler } from './application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { ListTeamspaceInvitationsHandler } from './application/queries/teamspace/list-teamspace-invitations/list-teamspace-invitations.handler';
import { ListTeamspaceInviteLinksHandler } from './application/queries/teamspace/list-teamspace-invite-links/list-teamspace-invite-links.handler';
import { TypeOrmTeamspaceMembershipLock } from './infrastructure/persistence/typeorm/adapters/typeorm-teamspace-membership-lock.adapter';
import { TeamspaceInvitationOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-invitation.orm-entity';
import { TeamspaceInviteLinkOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-invite-link.orm-entity';
import { TeamspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { TypeOrmTeamspaceInvitationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-teamspace-invitation.repository';
import { TypeOrmTeamspaceInviteLinkRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-teamspace-invite-link.repository';
import { TypeOrmTeamspaceMemberRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-teamspace-member.repository';
import { TypeOrmTeamspaceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-teamspace.repository';
import { TeamspaceController } from './presentation/http/controllers/teamspace.controller';
import { TEAMSPACE_TYPES } from './teamspace.types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamspaceOrmEntity,
      TeamspaceMemberOrmEntity,
      TeamspaceInvitationOrmEntity,
      TeamspaceInviteLinkOrmEntity,
    ]),
    WorkspaceModule,
    PermissionModule,
    DatabaseModule,
    OutboxModule,
  ],
  controllers: [TeamspaceController],
  providers: [
    {
      provide: TEAMSPACE_TYPES.applications.CreateTeamspaceHandler,
      useClass: CreateTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.AddTeamspaceMemberHandler,
      useClass: AddTeamspaceMemberHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.UpdateTeamspaceHandler,
      useClass: UpdateTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.ArchiveTeamspaceHandler,
      useClass: ArchiveTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.RestoreTeamspaceHandler,
      useClass: RestoreTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.GetArchivedTeamspacesHandler,
      useClass: GetArchivedTeamspacesHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.UpdateTeamspaceMemberRoleHandler,
      useClass: UpdateTeamspaceMemberRoleHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.RemoveTeamspaceMemberHandler,
      useClass: RemoveTeamspaceMemberHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.LeaveTeamspaceHandler,
      useClass: LeaveTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.InviteTeamspaceMemberHandler,
      useClass: InviteTeamspaceMemberHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.AcceptTeamspaceInvitationHandler,
      useClass: AcceptTeamspaceInvitationHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.DeclineTeamspaceInvitationHandler,
      useClass: DeclineTeamspaceInvitationHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.GetMyTeamspaceInvitationsHandler,
      useClass: GetMyTeamspaceInvitationsHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.ListTeamspaceInvitationsHandler,
      useClass: ListTeamspaceInvitationsHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.RevokeTeamspaceInvitationHandler,
      useClass: RevokeTeamspaceInvitationHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.ResendTeamspaceInvitationHandler,
      useClass: ResendTeamspaceInvitationHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.CreateTeamspaceInviteLinkHandler,
      useClass: CreateTeamspaceInviteLinkHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.JoinTeamspaceByLinkHandler,
      useClass: JoinTeamspaceByLinkHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.RevokeTeamspaceInviteLinkHandler,
      useClass: RevokeTeamspaceInviteLinkHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.ListTeamspaceInviteLinksHandler,
      useClass: ListTeamspaceInviteLinksHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.JoinTeamspaceHandler,
      useClass: JoinTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.DiscoverTeamspacesHandler,
      useClass: DiscoverTeamspacesHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.UpdateTeamspaceJoinSettingsHandler,
      useClass: UpdateTeamspaceJoinSettingsHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.GetTeamspacesHandler,
      useClass: GetTeamspacesHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.GetTeamspaceMembersHandler,
      useClass: GetTeamspaceMembersHandler,
    },
    {
      provide: TEAMSPACE_TYPES.repositories.TeamspaceRepository,
      useClass: TypeOrmTeamspaceRepository,
    },
    {
      provide: TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository,
      useClass: TypeOrmTeamspaceMemberRepository,
    },
    {
      provide: TEAMSPACE_TYPES.repositories.TeamspaceInvitationRepository,
      useClass: TypeOrmTeamspaceInvitationRepository,
    },
    {
      provide: TEAMSPACE_TYPES.repositories.TeamspaceInviteLinkRepository,
      useClass: TypeOrmTeamspaceInviteLinkRepository,
    },
    {
      provide: TEAMSPACE_TYPES.ports.TeamspaceMembershipLock,
      useClass: TypeOrmTeamspaceMembershipLock,
    },
  ],
})
export class TeamspaceModule {}
