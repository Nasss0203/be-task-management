import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Activity } from 'src/modules/activity/domain/entities/activity.entity';
import { Attachment } from 'src/modules/attachment/domain/entities/attachment.entity';
import { Mention } from 'src/modules/mentions/domain/entities/mention.entity';
import { Notification } from 'src/modules/notifications/domain/entities/notification.entity';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { PageBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageTemplateBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';
import { PageTemplateOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { Permission } from 'src/modules/permission/domain/entities/permission.entity';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';

import { DatabasePropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseViewPropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { DatabaseOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { UserProfile } from 'src/modules/user_profiles/domain/entities/user_profile.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { WorkspaceInviteOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-invite.orm-entity';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: 'public',
  synchronize: false,
  migrationsRun: false,
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
    Attachment,
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
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
