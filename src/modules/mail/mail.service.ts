import { MailerService } from '@nestjs-modules/mailer';
import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export type SendEmailTemplateInput = {
  to: string;
  from?: string;
  subject: string;
  template: string;
  context?: Record<string, unknown>;
};

type MailTransportError = {
  code?: string;
};

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  assertConfigured(): void {
    const user = process.env.USER_EMAIL?.trim();
    const password = process.env.PASSWORD_EMAIL?.trim();

    if (!user || !password) {
      throw new ServiceUnavailableException({
        code: 'MAIL_SERVICE_NOT_CONFIGURED',
        message:
          'Email service is not configured. Set USER_EMAIL and PASSWORD_EMAIL.',
      });
    }
  }

  async sendEmailTemplates({
    to,
    from,
    subject,
    template,
    context,
  }: SendEmailTemplateInput): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        from: from ?? `"Nass" <${process.env.USER_EMAIL}>`,
        subject,
        template,
        context,
      });
    } catch (error) {
      const code = (error as MailTransportError)?.code;

      if (code === 'EAUTH') {
        throw new BadGatewayException({
          code: 'MAIL_AUTH_FAILED',
          message:
            'SMTP authentication failed. Check USER_EMAIL and the Gmail App Password in PASSWORD_EMAIL.',
        });
      }

      if (['ECONNECTION', 'ESOCKET', 'ETIMEDOUT'].includes(code ?? '')) {
        throw new BadGatewayException({
          code: 'MAIL_CONNECTION_FAILED',
          message: 'Could not connect to the configured SMTP server.',
        });
      }

      throw new BadGatewayException({
        code: 'MAIL_SEND_FAILED',
        message: 'Could not send the credentials email.',
      });
    }
  }

  async sendInviteMember(input: {
    to: string;
    workspaceName: string;
    inviterName: string;
    roleName: string;
    acceptUrl: string;
  }): Promise<void> {
    await this.sendEmailTemplates({
      to: input.to,
      subject: 'Lời mời tham gia workspace',
      template: 'invite-member',
      context: {
        recipientName: input.to,
        workspaceName: input.workspaceName,
        inviterName: input.inviterName,
        roleName: input.roleName,
        acceptUrl: input.acceptUrl,
        expiredAt: '7 ngày kể từ lúc nhận email',
        year: new Date().getFullYear(),
        appName: 'Task Management',
      },
    });
  }

  async sendVerificationEmail(input: {
    to: string;
    recipientName: string;
    verifyUrl: string;
  }): Promise<void> {
    await this.sendEmailTemplates({
      to: input.to,
      subject: 'Xác nhận địa chỉ email của bạn',
      template: 'verify-email',
      context: {
        recipientName: input.recipientName,
        verifyUrl: input.verifyUrl,
        year: new Date().getFullYear(),
        appName: 'Task Management',
      },
    });
  }

  async sendResetPasswordEmail(input: {
    to: string;
    recipientName: string;
    resetUrl: string;
  }): Promise<void> {
    await this.sendEmailTemplates({
      to: input.to,
      subject: 'Khôi phục mật khẩu',
      template: 'reset-password',
      context: {
        recipientName: input.recipientName,
        resetUrl: input.resetUrl,
        year: new Date().getFullYear(),
        appName: 'Task Management',
      },
    });
  }

  async sendSystemAdminInvitation(input: {
    to: string;
    accountEmail: string;
    activationUrl: string;
  }): Promise<void> {
    await this.sendEmailTemplates({
      to: input.to,
      subject: 'Kích hoạt tài khoản quản trị hệ thống của bạn',
      template: 'system-admin-credentials',
      context: {
        accountEmail: input.accountEmail,
        activationUrl: input.activationUrl,
        year: new Date().getFullYear(),
        appName: 'Task Management',
      },
    });
  }

  async templateInviteMember(): Promise<void> {
    await this.sendEmailTemplates({
      to: 'anhnamnguyen0203@gmail.com',
      subject: 'Test',
      template: 'invite-member',
      context: {
        recipientName: 'Anh Nam',
        workspaceName: 'Task Management',
        inviterName: 'Nass',
        roleName: 'MEMBER',
        acceptUrl: 'http://localhost:3000/invite/accept?token=test-token',
        expiredAt: '7 ngày kể từ lúc nhận email',
        year: new Date().getFullYear(),
        appName: 'Task Management',
      },
    });
  }
}
