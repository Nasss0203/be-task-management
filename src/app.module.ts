import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BoardsModule } from './modules/boards/boards.module';
import { PermissionModule } from './modules/permission/permission.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RefreshTokenModule } from './modules/refresh_token/refresh_token.module';
import { RoleModule } from './modules/role/role.module';
import { RolePermissionModule } from './modules/role_permission/role_permission.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TaskPriorityModule } from './modules/task_priority/task_priority.module';
import { TaskStatusModule } from './modules/task_status/task_status.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UserProfilesModule } from './modules/user_profiles/user_profiles.module';
import { UserRolesModule } from './modules/user_roles/user_roles.module';
import { UserWorkspacesModule } from './modules/user_workspace/user_workspace.module';
import { UsersModule } from './modules/users/users.module';

import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { PageModule } from './modules/page/page.module';
import { PageBlockModule } from './modules/page_block/page_block.module';
import { SeedsModule } from './modules/seed/seed.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { MailModule } from './modules/mail/mail.module';
import { WorkspaceInvitesModule } from './modules/workspace_invites/workspace_invites.module';
import { AdminModule } from './modules/admin/admin.module';
import { TaskAssigneeModule } from './modules/task_assignee/task_assignee.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    SeedsModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    RefreshTokenModule,
    UserProfilesModule,
    UserWorkspacesModule,
    ProjectsModule,
    BoardsModule,
    TasksModule,
    TaskStatusModule,
    TaskPriorityModule,
    SprintsModule,
    UserRolesModule,
    PageModule,
    PageBlockModule,
    MailModule,
    WorkspaceInvitesModule,
    AdminModule,
    TaskAssigneeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // RbacSeedService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
