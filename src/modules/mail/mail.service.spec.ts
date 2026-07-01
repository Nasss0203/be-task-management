import { BadGatewayException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let mailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;
  let service: MailService;

  beforeEach(() => {
    mailerService = {
      sendMail: jest.fn(),
    };
    service = new MailService(mailerService as unknown as MailerService);
  });

  it('maps SMTP authentication failures to a safe API error', async () => {
    mailerService.sendMail.mockRejectedValue({ code: 'EAUTH' });

    await expect(
      service.sendEmailTemplates({
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'test',
      }),
    ).rejects.toMatchObject<Partial<BadGatewayException>>({
      response: {
        code: 'MAIL_AUTH_FAILED',
        message: expect.any(String),
      },
    });
  });

  it('maps SMTP connection failures to a safe API error', async () => {
    mailerService.sendMail.mockRejectedValue({ code: 'ETIMEDOUT' });

    await expect(
      service.sendEmailTemplates({
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'test',
      }),
    ).rejects.toMatchObject<Partial<BadGatewayException>>({
      response: {
        code: 'MAIL_CONNECTION_FAILED',
        message: expect.any(String),
      },
    });
  });
});
