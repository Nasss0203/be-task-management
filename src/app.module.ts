import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeatureGuard } from './common/guard/feature.guard';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { RateLimitGuard } from './common/guard/rate-limit.guard';
import { SystemRoleGuard } from './common/guard/system-role.guard';
import { WorkspaceResolverService } from './common/services/workspace-resolver.service';
import { DatabaseModule } from './database/database.module';
import { ActivityModule } from './modules/activity/activity.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiAssistantModule } from './modules/ai_assistant/ai_assistant.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { AuditLogsModule } from './modules/audit_logs/audit_logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { BoardsModule } from './modules/boards/boards.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FeaturesModule } from './modules/features/features.module';
import { MailModule } from './modules/mail/mail.module';
import { MentionsModule } from './modules/mentions/mentions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PageModule } from './modules/page/page.module';
import { PageBlockModule } from './modules/page_block/page_block.module';
import { PageTemplateBlocksModule } from './modules/page_template_blocks/page_template_blocks.module';
import { PageTemplatesModule } from './modules/page_templates/page_templates.module';
import { PermissionModule } from './modules/permission/permission.module';
import { PlanFeaturesModule } from './modules/plan_features/plan_features.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RefreshTokenModule } from './modules/refresh_token/refresh_token.module';
import { RoleModule } from './modules/role/role.module';
import { RolePermissionModule } from './modules/role_permission/role_permission.module';
import { SeedsModule } from './modules/seed/seed.module';
import { SprintReportsModule } from './modules/sprint_reports/sprint_reports.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { StorageModule } from './modules/storage/storage.module';
import { TaskAssigneeModule } from './modules/task_assignee/task_assignee.module';
import { TaskCommnentModule } from './modules/task_commnent/task_commnent.module';
import { TaskPositionModule } from './modules/task_position/task_position.module';
import { TaskPriorityModule } from './modules/task_priority/task_priority.module';
import { TaskStatusModule } from './modules/task_status/task_status.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UserProfilesModule } from './modules/user_profiles/user_profiles.module';
import { UserRolesModule } from './modules/user_roles/user_roles.module';
import { UserWorkspacesModule } from './modules/user_workspace/user_workspace.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspaceFeatureSettingsModule } from './modules/workspace_feature_settings/workspace_feature_settings.module';
import { WorkspaceInvitesModule } from './modules/workspace_invites/workspace_invites.module';
import { WorkspaceTemplatesModule } from './modules/workspace_templates/workspace_templates.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 300,
        },
      ],
      errorMessage: 'Too many requests. Please try again later.',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    DatabaseModule,
    AiAssistantModule,
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
    StorageModule,
    AttachmentModule,
    TaskCommnentModule,
    ActivityModule,
    PageTemplatesModule,
    PageTemplateBlocksModule,
    MentionsModule,
    AuditLogsModule,
    BillingModule,
    NotificationsModule,
    RealtimeModule,
    DashboardModule,
    FeaturesModule,
    PlanFeaturesModule,
    WorkspaceFeatureSettingsModule,
    WorkspaceTemplatesModule,
    SprintReportsModule,
    TaskPositionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WorkspaceResolverService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SystemRoleGuard,
    },
  ],
})
export class AppModule {}
