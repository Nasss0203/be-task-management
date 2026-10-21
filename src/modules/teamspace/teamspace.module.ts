import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';
import { AddTeamspaceMemberHandler } from './application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';
import { CreateTeamspaceHandler } from './application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { GetTeamspaceMembersHandler } from './application/queries/teamspace/get-teamspace-members/get-teamspace-members.handler';
import { GetTeamspacesHandler } from './application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { TeamspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { TypeOrmTeamspaceMemberRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-teamspace-member.repository';
import { TypeOrmTeamspaceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-teamspace.repository';
import { TeamspaceController } from './presentation/http/controllers/teamspace.controller';
import { TEAMSPACE_TYPES } from './teamspace.types';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamspaceOrmEntity, TeamspaceMemberOrmEntity]),
    WorkspaceModule,
    PermissionModule,
    DatabaseModule,
  ],
  controllers: [TeamspaceController],
  providers: [
    CreateTeamspaceHandler,
    AddTeamspaceMemberHandler,
    GetTeamspacesHandler,
    GetTeamspaceMembersHandler,
    {
      provide: TEAMSPACE_TYPES.applications.CreateTeamspaceHandler,
      useExisting: CreateTeamspaceHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.GetTeamspacesHandler,
      useExisting: GetTeamspacesHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.AddTeamspaceMemberHandler,
      useExisting: AddTeamspaceMemberHandler,
    },
    {
      provide: TEAMSPACE_TYPES.applications.GetTeamspaceMembersHandler,
      useExisting: GetTeamspaceMembersHandler,
    },
    {
      provide: TEAMSPACE_TYPES.repositories.TeamspaceRepository,
      useClass: TypeOrmTeamspaceRepository,
    },
    {
      provide: TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository,
      useClass: TypeOrmTeamspaceMemberRepository,
    },
  ],
})
export class TeamspaceModule {}
