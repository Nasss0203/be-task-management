import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

export type SendEmailTemplateInput = {
  to: string;
  from?: string;
  subject: string;
  template: string;
  context?: Record<string, unknown>;
};

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmailTemplates({
    to,
    from,
    subject,
    template,
    context,
  }: SendEmailTemplateInput): Promise<void> {
    await this.mailerService.sendMail({
      to,
      from: from ?? `"Nass" <${process.env.USER_EMAIL}>`,
      subject,
      template,
      context,
    });
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
