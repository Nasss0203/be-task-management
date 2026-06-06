import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VnpayModule } from 'nestjs-vnpay';
import { ignoreLogger } from 'vnpay';

import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { Project } from '../projects/domain/entities/project.entity';
import { BillingQueryApplicationImpl } from './applications/billing-query.application';
import { CreateBillingApplicationImpl } from './applications/create-billing.application';
import { BillingTestVnpayController } from './controller/billing-test-payment.controller';
import { BillingController } from './controller/billing.controller';
import { WorkspaceUsageLimitsController } from './controller/workspace-usage-limits.controller';
import { Payment } from './domain/entities/payment.entity';
import { Plan } from './domain/entities/plan.entity';
import { SubscriptionWorkspace } from './domain/entities/subscription-workspace.entity';
import { Subscription } from './domain/entities/subscription.entity';
import { UsageLimit } from './domain/entities/usage-limit.entity';
import { BILLING_TYPES } from './interfaces/types';
import { VnpayPaymentProviderImpl } from './providers/vnpay-payment.provider';
import { AdminBillingController } from './controller/admin-billing.controller';
import { PlanRepositoryImpl } from './repositories/plan/plan.repository';
import { PaymentRepositoryImpl } from './repositories/payment/payment.repository';
import { BillingQueryRepositoryImpl } from './repositories/query/billing-query.repository';
import { UsageLimitRepositoryImpl } from './repositories/usage-limit/usage-limit.repository';
import { WorkspaceLimitRepositoryImpl } from './repositories/workspace-limit/workspace-limit.repository';
import { CheckWorkspaceLimitServiceImpl } from './services/check-workspace-limit.service';
import { CompletePaymentServiceImpl } from './services/complete-payment/complete-payment.service';
import { VnpayIpnService } from './services/ipn/vnpay-ipn.service';
import { CreateBillingServiceImpl } from './services/payment/create-payment.service';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { BillingQueryServiceImpl } from './services/query/billing-query.service';
import { UsageLimitEnforcerServiceImpl } from './services/usage-limit/usage-limit-enforcer.service';

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([
      Plan,
      Payment,
      Subscription,
      SubscriptionWorkspace,
      UsageLimit,
      UserWorkspace,
      Workspace,
      Project,
    ]),

    VnpayModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        tmnCode: configService.getOrThrow<string>('VNPAY_TMN_CODE'),
        secureSecret: configService.getOrThrow<string>('VNPAY_SECURE_SECRET'),
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        enableLog: false,
        loggerFn: ignoreLogger,
      }),
    }),
  ],

  controllers: [
    AdminBillingController,
    BillingController,
    BillingTestVnpayController,
    WorkspaceUsageLimitsController,
  ],

  providers: [
    {
      provide: BILLING_TYPES.providers.VnpayPaymentProvider,
      useClass: VnpayPaymentProviderImpl,
    },
    {
      provide: BILLING_TYPES.repositories.PlanRepository,
      useClass: PlanRepositoryImpl,
    },
    {
      provide: BILLING_TYPES.repositories.PaymentRepository,
      useClass: PaymentRepositoryImpl,
    },
    {
      provide: BILLING_TYPES.repositories.BillingQueryRepository,
      useClass: BillingQueryRepositoryImpl,
    },
    {
      provide: BILLING_TYPES.repositories.WorkspaceLimitRepository,
      useClass: WorkspaceLimitRepositoryImpl,
    },
    {
      provide: BILLING_TYPES.repositories.UsageLimitRepository,
      useClass: UsageLimitRepositoryImpl,
    },
    {
      provide: BILLING_TYPES.applications.CreateBillingApplication,
      useClass: CreateBillingApplicationImpl,
    },
    {
      provide: BILLING_TYPES.applications.BillingQueryApplication,
      useClass: BillingQueryApplicationImpl,
    },
    {
      provide: BILLING_TYPES.services.CreateBillingService,
      useClass: CreateBillingServiceImpl,
    },
    {
      provide: BILLING_TYPES.services.BillingQueryService,
      useClass: BillingQueryServiceImpl,
    },
    {
      provide: BILLING_TYPES.services.CheckWorkspaceLimitService,
      useClass: CheckWorkspaceLimitServiceImpl,
    },
    {
      provide: BILLING_TYPES.services.UsageLimitEnforcerService,
      useClass: UsageLimitEnforcerServiceImpl,
    },
    {
      provide: BILLING_TYPES.services.CompletePaymentService,
      useClass: CompletePaymentServiceImpl,
    },
    VnpayIpnService,
  ],

  exports: [
    BILLING_TYPES.providers.VnpayPaymentProvider,
    BILLING_TYPES.repositories.PlanRepository,
    BILLING_TYPES.repositories.PaymentRepository,
    BILLING_TYPES.repositories.BillingQueryRepository,
    BILLING_TYPES.repositories.WorkspaceLimitRepository,
    BILLING_TYPES.repositories.UsageLimitRepository,
    BILLING_TYPES.services.CreateBillingService,
    BILLING_TYPES.services.BillingQueryService,
    BILLING_TYPES.services.CheckWorkspaceLimitService,
    BILLING_TYPES.services.UsageLimitEnforcerService,
    BILLING_TYPES.services.CompletePaymentService,
    BILLING_TYPES.applications.CreateBillingApplication,
    BILLING_TYPES.applications.BillingQueryApplication,
  ],
})
export class BillingModule {}
