import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RefreshTokenModule } from './modules/refresh_token/refresh_token.module';
import { RoleModule } from './modules/role/role.module';
import { RolePermissionModule } from './modules/role_permission/role_permission.module';
import { UserProfilesModule } from './modules/user_profiles/user_profiles.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { WorkspaceMembersModule } from './modules/workspace_members/workspace_members.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    WorkspacesModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    RefreshTokenModule,
    UserProfilesModule,
    WorkspaceMembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
