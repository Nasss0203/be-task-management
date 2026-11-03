import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { StrictWriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { SetFormAnswerKeyCommand } from 'src/modules/content/application/commands/form/set-form-answer-key/set-form-answer-key.command';
import { SetFormAnswerKeyHandler } from 'src/modules/content/application/commands/form/set-form-answer-key/set-form-answer-key.handler';
import { SubmitFormResponseCommand } from 'src/modules/content/application/commands/form/submit-form-response/submit-form-response.command';
import {
  SubmitFormResponseHandler,
  type SubmitFormResponseResult,
} from 'src/modules/content/application/commands/form/submit-form-response/submit-form-response.handler';
import { FormAnswerKeyResponseDto } from 'src/modules/content/application/dto/form/response/form-answer-key.response.dto';
import { SetFormAnswerKeyDto } from 'src/modules/content/application/dto/form/set-form-answer-key.dto';
import { SubmitFormResponseDto } from 'src/modules/content/application/dto/form/submit-form-response.dto';
import { GetFormAnswerKeysHandler } from 'src/modules/content/application/queries/form/get-form-answer-keys/get-form-answer-keys.handler';
import { GetFormAnswerKeysQuery } from 'src/modules/content/application/queries/form/get-form-answer-keys/get-form-answer-keys.query';
import { GetFormStructureHandler } from 'src/modules/content/application/queries/form/get-form-structure/get-form-structure.handler';
import { GetFormStructureQuery } from 'src/modules/content/application/queries/form/get-form-structure/get-form-structure.query';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';

@Controller('forms')
export class FormController {
  constructor(
    private readonly submitFormResponseHandler: SubmitFormResponseHandler,
    private readonly getFormStructureHandler: GetFormStructureHandler,
    private readonly getFormAnswerKeysHandler: GetFormAnswerKeysHandler,
    private readonly setFormAnswerKeyHandler: SetFormAnswerKeyHandler,
  ) {}

  @Get(':blockId/answer-keys')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Get form answer keys')
  getAnswerKeys(
    @Param('blockId', ParseUUIDPipe) sectionBlockId: string,
    @Auth() auth: IAuth,
  ): Promise<FormAnswerKeyResponseDto[]> {
    return this.getFormAnswerKeysHandler.execute(
      new GetFormAnswerKeysQuery(sectionBlockId, auth.id),
    );
  }

  @Put(':blockId/answer-keys/:fieldBlockId')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Set form answer key')
  setAnswerKey(
    @Param('blockId', ParseUUIDPipe) sectionBlockId: string,
    @Param('fieldBlockId', ParseUUIDPipe) fieldBlockId: string,
    @Body() dto: SetFormAnswerKeyDto,
    @Auth() auth: IAuth,
  ): Promise<FormAnswerKeyResponseDto> {
    return this.setFormAnswerKeyHandler.execute(
      new SetFormAnswerKeyCommand(
        sectionBlockId,
        fieldBlockId,
        dto.correct_value,
        dto.points,
        auth.id,
      ),
    );
  }

  /** Authorized on the form's page, so fillers need no access to the database page. */
  @Get(':blockId')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Get form structure')
  getStructure(@Param('blockId', ParseUUIDPipe) sectionBlockId: string) {
    return this.getFormStructureHandler.execute(
      new GetFormStructureQuery(sectionBlockId),
    );
  }

  @Post(':blockId/responses')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Submit form response')
  submit(
    @Param('blockId', ParseUUIDPipe) sectionBlockId: string,
    @Body() dto: SubmitFormResponseDto,
    @Auth() auth: IAuth,
  ): Promise<SubmitFormResponseResult> {
    return this.submitFormResponseHandler.execute(
      new SubmitFormResponseCommand(sectionBlockId, dto.answers, auth.id),
    );
  }
}
