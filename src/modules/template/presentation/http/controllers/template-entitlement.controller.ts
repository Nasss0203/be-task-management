import { Controller, Inject, Param, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { WriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { ClaimFreeTemplateCommand } from 'src/modules/template/application/commands/template-entitlement/claim-free-template/claim-free-template.command';
import { ClaimFreeTemplateHandler } from 'src/modules/template/application/commands/template-entitlement/claim-free-template/claim-free-template.handler';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import type { IAuth } from 'src/types/auth';

@Controller('templates')
export class TemplateEntitlementController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.ClaimFreeTemplateHandler)
    private readonly claimFreeTemplateHandler: ClaimFreeTemplateHandler,
  ) {}

  @Post(':templateId/claim')
  @WriteRateLimit()
  @ResponseMessage('Template claimed successfully')
  async claim(@Param('templateId') templateId: string, @Auth() auth: IAuth) {
    return this.claimFreeTemplateHandler.execute(
      new ClaimFreeTemplateCommand(templateId, auth.id),
    );
  }
}
