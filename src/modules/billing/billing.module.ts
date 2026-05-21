import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VnpayModule } from 'nestjs-vnpay';
import { ignoreLogger } from 'vnpay';

import { BillingTestVnpayController } from './controller/billing-test-payment.controller';
import { BillingController } from './controller/billing.controller';
import { BILLING_TYPES } from './interfaces/types';
import { VnpayPaymentProviderImpl } from './providers/vnpay-payment.provider';

@Module({
  imports: [
    ConfigModule,

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
  ],
  exports: [BILLING_TYPES.providers.VnpayPaymentProvider],
})
export class BillingModule {}
