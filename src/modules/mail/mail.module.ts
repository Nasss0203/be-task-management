import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailController } from './presentation/http/controllers/mail.controller';
import { MailService } from './application/services/mail.service';
import { MAIL_TYPES } from './mail.types';
import { SmtpMailSender } from './infrastructure/providers/smtp-mail.sender';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('HOST_EMAIL') || 'smtp.gmail.com',
          port: Number(configService.get('PORT_EMAIL')) || 465,
          secure: Number(configService.get('PORT_EMAIL')) === 465,
          connectionTimeout: 5_000,
          greetingTimeout: 5_000,
          socketTimeout: 10_000,
          auth: {
            user: configService.get<string>('USER_EMAIL'),
            pass: configService
              .get<string>('PASSWORD_EMAIL')
              ?.replace(/\s/g, ''),
          },
        },
        defaults: {
          from: '"No Reply" <noreply@example.com>',
        },
        // preview: true,
        template: {
          dir: join(
            process.cwd(),
            'src',
            'modules',
            'mail',
            'infrastructure',
            'templates',
          ),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [
    MailService,
    { provide: MAIL_TYPES.providers.MailSender, useClass: SmtpMailSender },
  ],
  exports: [MailService],
})
export class MailModule {}
