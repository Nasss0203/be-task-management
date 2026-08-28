// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from 'src/modules/activity/domain/entities/activity.entity';
import { AttachmentOrmEntity } from 'src/modules/attachment/infrastructure/persistence/typeorm/entities/attachment.orm-entity';
import { DatabasePropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseViewPropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { DatabaseOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { Mention } from 'src/modules/mentions/domain/entities/mention.entity';
import { Notification } from 'src/modules/notifications/domain/entities/notification.entity';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { PageBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageTemplateBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';
import { PageTemplateOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { Permission } from 'src/modules/permission/domain/entities/permission.entity';
import { RefreshToken } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/refresh-token.orm-entity';
import { UserProfile } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { User } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { WorkspaceInviteOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-invite.orm-entity';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: false,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        migrationsRun: false,
        schema: 'public',
        logging: true,
        entities: [
          User,
          WorkspaceOrmEntity,
          Permission,
          UserProfile,
          RefreshToken,
          WorkspaceMemberOrmEntity,
          PageOrmEntity,
          PageBlockOrmEntity,
          WorkspaceInviteOrmEntity,
          AttachmentOrmEntity,
          Activity,
          Mention,
          Notification,
          PageTemplateBlockOrmEntity,
          PageTemplateOrmEntity,

          // V2
          DatabasePropertyOrmEntity,
          DatabaseOrmEntity,
          PropertyOptionOrmEntity,
          DatabaseRowOrmEntity,
          RowValueOrmEntity,
          DatabaseViewOrmEntity,
          DatabaseViewPropertyOrmEntity,
        ],
      }),
    }),
  ],
  providers: [
    {
      provide: PERSISTENCE_TYPES.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [PERSISTENCE_TYPES.UnitOfWork],
})
export class DatabaseModule {}
