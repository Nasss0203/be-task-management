// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from 'src/modules/activity/domain/entities/activity.entity';
import { Attachment } from 'src/modules/attachment/domain/entities/attachment.entity';
import { AuditLog } from 'src/modules/audit_logs/domain/entities/audit_log.entity';
import { BillingWebhook } from 'src/modules/billing/domain/entities/billing-webhook.entity';
import { Invoice } from 'src/modules/billing/domain/entities/invoice.entity';
import { Payment } from 'src/modules/billing/domain/entities/payment.entity';
import { Plan } from 'src/modules/billing/domain/entities/plan.entity';
import { SubscriptionWorkspace } from 'src/modules/billing/domain/entities/subscription-workspace.entity';
import { Subscription } from 'src/modules/billing/domain/entities/subscription.entity';
import { UsageLimit } from 'src/modules/billing/domain/entities/usage-limit.entity';
import { Board } from 'src/modules/boards/domain/entities/board.entity';
import { Feature } from 'src/modules/features/domain/entities/feature.entity';
import { Mention } from 'src/modules/mentions/domain/entities/mention.entity';
import { Notification } from 'src/modules/notifications/domain/entities/notification.entity';
import { Page } from 'src/modules/page/domain/entities/page.entity';
import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';
import { PageTemplateBlock } from 'src/modules/page_template_blocks/domain/entities/page_template_block.entity';
import { PageTemplate } from 'src/modules/page_templates/domain/entities/page_template.entity';
import { Permission } from 'src/modules/permission/domain/entities/permission.entity';
import { PlanFeature } from 'src/modules/plan_features/domain/entities/plan_feature.entity';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { Role } from 'src/modules/role/domain/entities/role.entity';
import { RolePermission } from 'src/modules/role_permission/domain/entities/role_permission.entity';
import { Sprint } from 'src/modules/sprints/domain/entities/sprint.entity';
import { TaskAssignee } from 'src/modules/task_assignee/domain/entities/task_assignee.entity';
import { TaskComment } from 'src/modules/task_commnent/domain/entities/task_commnent.entity';
import { TaskPriority } from 'src/modules/task_priority/domain/entities/task_priority.entity';
import { TaskStatus } from 'src/modules/task_status/domain/entities/task_status.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import { UserProfile } from 'src/modules/user_profiles/domain/entities/user_profile.entity';
import { UserRole } from 'src/modules/user_roles/domain/entities/user_role.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { WorkspaceFeatureSetting } from 'src/modules/workspace_feature_settings/domain/entities/workspace_feature_setting.entity';
import { WorkspaceInvite } from 'src/modules/workspace_invites/domain/entities/workspace_invite.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { WorkspaceTemplate } from 'src/modules/workspace_templates/domain/entities/workspace_template.entity';

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
          UserActivity,
          Workspace,
          Permission,
          Role,
          RolePermission,
          UserProfile,
          RefreshToken,
          UserWorkspace,
          UserRole,
          Page,
          PageBlock,
          Project,
          Sprint,
          Task,
          Board,
          TaskStatus,
          TaskPriority,
          WorkspaceInvite,
          TaskAssignee,
          Attachment,
          TaskComment,
          Activity,
          AuditLog,
          BillingWebhook,
          Invoice,
          Payment,
          Plan,
          Subscription,
          UsageLimit,
          Mention,
          Notification,
          PageTemplateBlock,
          PageTemplate,
          SubscriptionWorkspace,
          Feature,
          PlanFeature,
          WorkspaceFeatureSetting,
          WorkspaceTemplate,
        ],
      }),
    }),
  ],
})
export class DatabaseModule { }
