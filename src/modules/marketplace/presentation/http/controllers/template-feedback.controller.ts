import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { WriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { IAuth } from 'src/types/auth';

import { DeleteTemplateReviewCommand } from '../../../application/commands/template-feedback/delete-template-review/delete-template-review.command';
import { DeleteTemplateReviewHandler } from '../../../application/commands/template-feedback/delete-template-review/delete-template-review.handler';
import { SetTemplateLikeCommand } from '../../../application/commands/template-feedback/set-template-like/set-template-like.command';
import { SetTemplateLikeHandler } from '../../../application/commands/template-feedback/set-template-like/set-template-like.handler';
import { UpsertTemplateReviewCommand } from '../../../application/commands/template-feedback/upsert-template-review/upsert-template-review.command';
import {
  UpsertTemplateReviewHandler,
  UpsertTemplateReviewResult,
} from '../../../application/commands/template-feedback/upsert-template-review/upsert-template-review.handler';
import { TemplateLikeResponseDto } from '../../../application/dto/template-feedback/template-feedback.response.dto';
import { UpsertTemplateReviewRequest } from '../requests/upsert-template-review.request';

@Controller('templates')
export class TemplateFeedbackController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.UpsertTemplateReviewHandler)
    private readonly upsertReviewHandler: UpsertTemplateReviewHandler,

    @Inject(MARKETPLACE_TYPES.applications.DeleteTemplateReviewHandler)
    private readonly deleteReviewHandler: DeleteTemplateReviewHandler,

    @Inject(MARKETPLACE_TYPES.applications.SetTemplateLikeHandler)
    private readonly setLikeHandler: SetTemplateLikeHandler,
  ) {}

  @Put(':templateId/review')
  @WriteRateLimit()
  @ResponseMessage('Template review saved')
  upsertReview(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() request: UpsertTemplateReviewRequest,
    @Auth() auth: IAuth,
  ): Promise<UpsertTemplateReviewResult> {
    return this.upsertReviewHandler.execute(
      new UpsertTemplateReviewCommand(
        templateId,
        auth.id,
        request.rating,
        request.body,
      ),
    );
  }

  @Delete(':templateId/review')
  @WriteRateLimit()
  @ResponseMessage('Template review deleted')
  deleteReview(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    return this.deleteReviewHandler.execute(
      new DeleteTemplateReviewCommand(templateId, auth.id),
    );
  }

  @Put(':templateId/like')
  @WriteRateLimit()
  @ResponseMessage('Template liked')
  like(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Auth() auth: IAuth,
  ): Promise<TemplateLikeResponseDto> {
    return this.setLikeHandler.execute(
      new SetTemplateLikeCommand(templateId, auth.id, true),
    );
  }

  @Delete(':templateId/like')
  @WriteRateLimit()
  @ResponseMessage('Template unliked')
  unlike(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Auth() auth: IAuth,
  ): Promise<TemplateLikeResponseDto> {
    return this.setLikeHandler.execute(
      new SetTemplateLikeCommand(templateId, auth.id, false),
    );
  }
}
