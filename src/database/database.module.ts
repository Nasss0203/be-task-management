// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { RolePermission } from 'src/modules/role_permission/entities/role_permission.entity';
import { UserProfile } from 'src/modules/user_profiles/entities/user_profile.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserWorkspace } from 'src/modules/workspace_members/domain/entities/user_workspace.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

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
        synchronize: true,
        migrationsRun: true,
        schema: 'public',
        logging: true,
        entities: [
          User,
          Workspace,
          Permission,
          Role,
          RolePermission,
          UserProfile,
          RefreshToken,
          UserWorkspace,
        ],
      }),
    }),
  ],
})
export class DatabaseModule {}
