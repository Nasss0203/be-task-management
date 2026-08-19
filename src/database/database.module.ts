// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from 'src/modules/activity/domain/entities/activity.entity';
import { Attachment } from 'src/modules/attachment/domain/entities/attachment.entity';
import { DatabasePropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseViewPropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { DatabaseOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { Mention } from 'src/modules/mentions/domain/entities/mention.entity';
import { Notification } from 'src/modules/notifications/domain/entities/notification.entity';
import { Page } from 'src/modules/page/domain/entities/page.entity';
import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';
import { PageTemplateBlock } from 'src/modules/page_template_blocks/domain/entities/page_template_block.entity';
import { PageTemplate } from 'src/modules/page_templates/domain/entities/page_template.entity';
import { Permission } from 'src/modules/permission/domain/entities/permission.entity';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { UserProfile } from 'src/modules/user_profiles/domain/entities/user_profile.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { WorkspaceInviteOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-invite.orm-entity';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';

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
          Page,
          PageBlock,
          WorkspaceInviteOrmEntity,
          Attachment,
          Activity,
          Mention,
          Notification,
          PageTemplateBlock,
          PageTemplate,

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
})
export class DatabaseModule {}
