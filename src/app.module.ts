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
import { RbacSeedService } from './modules/seed/rbac.seed.service';
import { SeedsModule } from './modules/seed/seeds.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UserProfilesModule } from './modules/user_profiles/user_profiles.module';
import { UserWorkspacesModule } from './modules/user_workspace/user_workspace.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspaceTemplatesModule } from './modules/workspace_templates/workspace_templates.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { TaskStatusModule } from './modules/task_status/task_status.module';
import { TaskPriorityModule } from './modules/task_priority/task_priority.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { UserRolesModule } from './modules/user_roles/user_roles.module';

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
    WorkspaceTemplatesModule,
    TaskStatusModule,
    TaskPriorityModule,
    SprintsModule,
    UserRolesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RbacSeedService,
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
