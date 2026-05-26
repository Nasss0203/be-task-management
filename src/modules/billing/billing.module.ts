import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VnpayModule } from 'nestjs-vnpay';
import { ignoreLogger } from 'vnpay';

import { UserWorkspace } from '../user_workspace/domain/entities/user_workspace.entity';
import { BillingTestVnpayController } from './controller/billing-test-payment.controller';
import { BillingController } from './controller/billing.controller';
import { Payment } from './domain/entities/payment.entity';
import { Plan } from './domain/entities/plan.entity';
import { SubscriptionWorkspace } from './domain/entities/subscription-workspace.entity';
import { Subscription } from './domain/entities/subscription.entity';
import { UsageLimit } from './domain/entities/usage-limit.entity';
import { BILLING_TYPES } from './interfaces/types';
import { VnpayPaymentProviderImpl } from './providers/vnpay-payment.provider';
import { PlanRepositoryImpl } from './repositories/plan/plan.repository';
import { PaymentRepositoryImpl } from './repositories/payment/payment.repository';
import { CheckWorkspaceLimitService } from './services/check-workspace-limit.service';
import { CompletePaymentService } from './services/complete-payment/complete-payment.service';
import { VnpayIpnService } from './services/ipn/vnpay-ipn.service';
import { CreateBillingServiceImpl } from './services/payment/create-payment.service'; 
import { Workspace } from '../workspaces/domain/entities/workspace.entity';

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

  controllers: [BillingController, BillingTestVnpayController],

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
      provide: BILLING_TYPES.services.CreateBillingService,
      useClass: CreateBillingServiceImpl,
    },
    VnpayIpnService,
    CompletePaymentService,
    CheckWorkspaceLimitService,
  ],

  exports: [
    BILLING_TYPES.providers.VnpayPaymentProvider,
    BILLING_TYPES.repositories.PlanRepository,
    BILLING_TYPES.repositories.PaymentRepository,
    BILLING_TYPES.services.CreateBillingService,
    CheckWorkspaceLimitService,
  ],
})
export class BillingModule {}
