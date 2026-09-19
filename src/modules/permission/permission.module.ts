import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';
import { PageBlockOrmEntity } from '../content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageShareLinkOrmEntity } from '../content/infrastructure/persistence/typeorm/entities/page-share-link.orm-entity';
import { PageOrmEntity } from '../content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { TeamspaceMemberOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { WorkspaceMemberOrmEntity } from '../workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { AuthorizationService } from './application/services/authorization.service';
import { EffectivePageAccessService } from './application/services/effective-page-access.service';
import { TypeOrmResourceAuthorizationReader } from './infrastructure/persistence/typeorm/adapters/resource-authorization-reader.adapter';
import { TypeOrmTeamspacePermissionReader } from './infrastructure/persistence/typeorm/adapters/teamspace-permission-reader.adapter';
import { TypeOrmWorkspacePermissionReader } from './infrastructure/persistence/typeorm/adapters/workspace-permission-reader.adapter';
import { TypeOrmPageGeneralAccessReader } from './infrastructure/persistence/typeorm/readers/typeorm-page-general-access.reader';
import { TypeOrmPageShareLinkAuthorizationReader } from './infrastructure/persistence/typeorm/readers/typeorm-page-share-link-authorization.reader';
import { TypeOrmPageSharePermissionReader } from './infrastructure/persistence/typeorm/readers/typeorm-page-share-permission.reader';
import { PERMISSION_TYPES } from './permission.types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceMemberOrmEntity,
      TeamspaceOrmEntity,
      TeamspaceMemberOrmEntity,
      PageOrmEntity,
      PageBlockOrmEntity,
      PageShareLinkOrmEntity,
    ]),
  ],
  providers: [
    AuthorizationService,
    EffectivePageAccessService,
    PageShareLinkTokenService,
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
    {
      provide: PERMISSION_TYPES.ports.PageSharePermissionReader,
      useClass: TypeOrmPageSharePermissionReader,
    },
    {
      provide: PERMISSION_TYPES.ports.PageGeneralAccessReader,

      useClass: TypeOrmPageGeneralAccessReader,
    },
    {
      provide: PERMISSION_TYPES.ports.PageShareLinkAuthorizationReader,
      useClass: TypeOrmPageShareLinkAuthorizationReader,
    },
  ],
  exports: [
    AuthorizationService,
    EffectivePageAccessService,

    PERMISSION_TYPES.ports.PageSharePermissionReader,
    PERMISSION_TYPES.ports.PageGeneralAccessReader,
  ],
})
export class PermissionModule {}
