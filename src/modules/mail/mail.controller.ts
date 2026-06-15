import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/decorator/public.decorator';
import { StrictWriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { MailService } from './mail.service';
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @Public()
  @StrictWriteRateLimit()
  @ResponseMessage('Send email invite member')
  async sendEmailInviteMember() {
    await this.mailService.templateInviteMember();
  }
}
