// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from 'src/modules/activity/domain/entities/activity.entity';
import { AttachmentOrmEntity } from 'src/modules/attachment/infrastructure/persistence/typeorm/entities/attachment.orm-entity';
import { PageBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageTemplateBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-template-block.orm-entity';
import { PageTemplateOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { DatabasePropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseViewPropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { DatabaseOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { RefreshToken } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/refresh-token.orm-entity';
import { UserProfile } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { User } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { Mention } from 'src/modules/mentions/domain/entities/mention.entity';
import { Notification } from 'src/modules/notifications/domain/entities/notification.entity';
import { Permission } from 'src/modules/permission/infrastructure/persistence/typeorm/entities/legacy-permission.orm-entity';
import { WorkspaceInviteOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-invite.orm-entity';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';

import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { BillingFeatureOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/billing-feature.orm-entity';
import { BillingPlanFeatureOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/billing-plan-feature.orm-entity';
import { BillingPlanPriceOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/billing-plan-price.orm-entity';
import { BillingPlanOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/billing-plan.orm-entity';
import { BillingUsageOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/billing-usage.orm-entity';
import { BillingWebhookEventOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/billing-webhook-event.orm-entity';
import { PaymentOrderOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/payment-order.orm-entity';
import { PaymentTransactionOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/payment-transaction.orm-entity';
import { WorkspaceSubscriptionOrmEntity } from 'src/modules/billing/infrastructure/persistence/typeorm/entities/workspace-subscription.orm-entity';
import { PageFavoriteOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-favorite.orm-entity';
import { TeamspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

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
          TeamspaceOrmEntity,
          TeamspaceMemberOrmEntity,
          PageFavoriteOrmEntity,
          // Billing
          BillingFeatureOrmEntity,
          BillingPlanFeatureOrmEntity,
          BillingPlanPriceOrmEntity,
          BillingPlanOrmEntity,
          BillingUsageOrmEntity,
          BillingWebhookEventOrmEntity,
          PaymentOrderOrmEntity,
          PaymentTransactionOrmEntity,
          WorkspaceSubscriptionOrmEntity,
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
