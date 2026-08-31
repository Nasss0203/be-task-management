import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlockOrmEntity } from '../content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageOrmEntity } from '../content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { TeamspaceMemberOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { WorkspaceMemberOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { AuthorizationService } from './application/services/authorization.service';
import { TypeOrmResourceAuthorizationReader } from './infrastructure/persistence/typeorm/adapters/resource-authorization-reader.adapter';
import { TypeOrmTeamspacePermissionReader } from './infrastructure/persistence/typeorm/adapters/teamspace-permission-reader.adapter';
import { TypeOrmWorkspacePermissionReader } from './infrastructure/persistence/typeorm/adapters/workspace-permission-reader.adapter';
import { PERMISSION_TYPES } from './permission.types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceMemberOrmEntity,
      TeamspaceOrmEntity,
      TeamspaceMemberOrmEntity,
      PageOrmEntity,
      PageBlockOrmEntity,
    ]),
  ],
  providers: [
    AuthorizationService,
    {
      provide: PERMISSION_TYPES.ports.WorkspacePermissionReader,
      useClass: TypeOrmWorkspacePermissionReader,
    },
    {
      provide: PERMISSION_TYPES.ports.TeamspacePermissionReader,
      useClass: TypeOrmTeamspacePermissionReader,
    },
    {
      provide: PERMISSION_TYPES.ports.ResourceAuthorizationReader,
      useClass: TypeOrmResourceAuthorizationReader,
    },
  ],
  exports: [AuthorizationService],
})
export class PermissionModule {}
