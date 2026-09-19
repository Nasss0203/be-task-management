import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {
  MailMessage,
  MailSender,
} from '../../application/ports/mail-sender.port';

@Injectable()
export class SmtpMailSender implements MailSender {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(message: MailMessage): Promise<void> {
    await this.mailerService.sendMail(message);
  }
}
