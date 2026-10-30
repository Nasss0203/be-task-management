import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { StrictWriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { SubmitFormResponseCommand } from 'src/modules/content/application/commands/form/submit-form-response/submit-form-response.command';
import {
  SubmitFormResponseHandler,
  type SubmitFormResponseResult,
} from 'src/modules/content/application/commands/form/submit-form-response/submit-form-response.handler';
import { SubmitFormResponseDto } from 'src/modules/content/application/dto/form/submit-form-response.dto';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

@Controller('forms')
export class FormController {
  constructor(
    private readonly submitFormResponseHandler: SubmitFormResponseHandler,
  ) {}

  @Post(':blockId/responses')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Submit form response')
  submit(
    @Param('blockId', ParseUUIDPipe) sectionBlockId: string,
    @Body() dto: SubmitFormResponseDto,
  ): Promise<SubmitFormResponseResult> {
    return this.submitFormResponseHandler.execute(
      new SubmitFormResponseCommand(sectionBlockId, dto.answers),
    );
  }
}
