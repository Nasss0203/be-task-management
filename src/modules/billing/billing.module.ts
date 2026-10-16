import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentModule } from '../payment/payment.module';

import { DatabaseModule } from 'src/database/database.module';
import { CreateBillingCheckoutHandler } from './application/commands/checkout/create-billing-checkout/create-billing-checkout.handler';
import { ProcessSepayPgIpnHandler } from './application/commands/webhook/process-sepay-pg-ipn/process-sepay-pg-ipn.handler';
import { ProcessSepayWebhookHandler } from './application/commands/webhook/process-sepay-webhook/process-sepay-webhook.handler';
import { ProcessStripeWebhookHandler } from './application/commands/webhook/process-stripe-webhook/process-stripe-webhook.handler';
import { GetBillingPaymentStatusHandler } from './application/queries/payment/get-billing-payment-status/get-billing-payment-status.handler';
import { ListBillingPlansHandler } from './application/queries/plan/list-billing-plans/list-billing-plans.handler';
import { GetWorkspaceSubscriptionHandler } from './application/queries/subscription/get-workspace-subscription/get-workspace-subscription.handler';
import { BillingPaymentSettlementService } from './application/services/billing-payment-settlement.service';
import { WorkspaceSubscriptionProvisioningService } from './application/services/workspace-subscription-provisioning.service';
import { BILLING_TYPES } from './billing.types';
import { BillingFeatureOrmEntity } from './infrastructure/persistence/typeorm/entities/billing-feature.orm-entity';
import { BillingPlanFeatureOrmEntity } from './infrastructure/persistence/typeorm/entities/billing-plan-feature.orm-entity';
import { BillingPlanPriceOrmEntity } from './infrastructure/persistence/typeorm/entities/billing-plan-price.orm-entity';
import { BillingPlanOrmEntity } from './infrastructure/persistence/typeorm/entities/billing-plan.orm-entity';
import { BillingWebhookEventOrmEntity } from './infrastructure/persistence/typeorm/entities/billing-webhook-event.orm-entity';
import { PaymentOrderOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-order.orm-entity';
import { WorkspaceSubscriptionOrmEntity } from './infrastructure/persistence/typeorm/entities/workspace-subscription.orm-entity';
import { TypeOrmBillingFeatureRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-billing-feature.repository';
import { TypeOrmBillingPlanFeatureRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-billing-plan-feature.repository';
import { TypeOrmBillingPlanPriceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-billing-plan-price.repository';
import { TypeOrmBillingPlanRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-billing-plan.repository';
import { TypeOrmBillingWebhookEventRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-billing-webhook-event.repository';
import { TypeOrmPaymentOrderRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-payment-order.repository';
import { TypeOrmWorkspaceSubscriptionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-workspace-subscription.repository';
import { BillingController } from './presentation/controllers/billing.controller';
import { SepayWebhookController } from './presentation/controllers/sepay-webhook.controller';

@Module({
  imports: [
    PaymentModule,
    DatabaseModule,
    TypeOrmModule.forFeature([
      BillingPlanOrmEntity,
      BillingFeatureOrmEntity,
      BillingPlanFeatureOrmEntity,
      BillingPlanPriceOrmEntity,
      PaymentOrderOrmEntity,
      WorkspaceSubscriptionOrmEntity,
      BillingWebhookEventOrmEntity,
    ]),
  ],

  controllers: [
    BillingController,
    SepayWebhookController,
  ],

  providers: [
    {
      provide: BILLING_TYPES.repositories.BillingPlanRepository,
      useClass: TypeOrmBillingPlanRepository,
    },
    {
      provide: BILLING_TYPES.repositories.BillingFeatureRepository,
      useClass: TypeOrmBillingFeatureRepository,
    },
    {
      provide: BILLING_TYPES.repositories.BillingPlanFeatureRepository,
      useClass: TypeOrmBillingPlanFeatureRepository,
    },
    {
      provide: BILLING_TYPES.repositories.BillingPlanPriceRepository,
      useClass: TypeOrmBillingPlanPriceRepository,
    },
    {
      provide: BILLING_TYPES.repositories.PaymentOrderRepository,
      useClass: TypeOrmPaymentOrderRepository,
    },
    {
      provide: BILLING_TYPES.repositories.WorkspaceSubscriptionRepository,
      useClass: TypeOrmWorkspaceSubscriptionRepository,
    },
    {
      provide: BILLING_TYPES.repositories.BillingWebhookEventRepository,
      useClass: TypeOrmBillingWebhookEventRepository,
    },
    {
      provide: BILLING_TYPES.applications.ListBillingPlansHandler,
      useClass: ListBillingPlansHandler,
    },
    {
      provide: BILLING_TYPES.applications.CreateBillingCheckoutHandler,
      useClass: CreateBillingCheckoutHandler,
    },
    {
      provide: BILLING_TYPES.services.WorkspaceSubscriptionProvisioningService,
      useClass: WorkspaceSubscriptionProvisioningService,
    },
    {
      provide: BILLING_TYPES.applications.ProcessSepayWebhookHandler,
      useClass: ProcessSepayWebhookHandler,
    },
    {
      provide: BILLING_TYPES.services.BillingPaymentSettlementService,
      useClass: BillingPaymentSettlementService,
    },
    {
      provide: BILLING_TYPES.applications.ProcessSepayPgIpnHandler,
      useClass: ProcessSepayPgIpnHandler,
    },
    {
      provide: BILLING_TYPES.applications.ProcessStripeWebhookHandler,
      useClass: ProcessStripeWebhookHandler,
    },
    {
      provide: BILLING_TYPES.applications.GetBillingPaymentStatusHandler,
      useClass: GetBillingPaymentStatusHandler,
    },
    {
      provide: BILLING_TYPES.applications.GetWorkspaceSubscriptionHandler,
      useClass: GetWorkspaceSubscriptionHandler,
    },
  ],
  exports: [
    BILLING_TYPES.applications.ProcessStripeWebhookHandler,
  ],
})
export class BillingModule {}
