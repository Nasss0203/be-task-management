import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { RateLimitGuard } from './common/guard/rate-limit.guard';
import { SystemRoleGuard } from './common/guard/system-role.guard';
import { WorkspaceResolverService } from './common/services/workspace-resolver.service';
import { DatabaseModule } from './database/database.module';
import { ActivityModule } from './modules/activity/activity.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiAssistantModule } from './modules/ai_assistant/ai-assistant.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { BillingModule } from './modules/billing/billing.module';
import { ContentModule } from './modules/content/content.module';
import { DatabaseModule as DatabaseModules } from './modules/database/database.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MailModule } from './modules/mail/mail.module';
import { MentionsModule } from './modules/mentions/mentions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionModule } from './modules/permission/permission.module';
import { StripeWebhookModule } from './modules/stripe-webhook/stripe-webhook.module';
import { TemplateModule } from './modules/template/template.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TeamspaceModule } from './modules/teamspace/teamspace.module';
import { QueueModule } from './shared/infrastructure/queue/queue.module';
import { OutboxModule } from './shared/infrastructure/outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    EventEmitterModule.forRoot(),
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
    IdentityModule,
    WorkspaceModule,
    TeamspaceModule,
    PermissionModule,
    ContentModule,
    TemplateModule,
    MailModule,
    AttachmentModule,
    ActivityModule,
    AiAssistantModule,
    MentionsModule,
    NotificationsModule,
    //V2
    BillingModule,
    DatabaseModules,
    AdminModule,

    QueueModule,
    OutboxModule,
    StripeWebhookModule,
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
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SystemRoleGuard,
    },
  ],
})
export class AppModule {}
