import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FormAnswerKeyResponseDto } from 'src/modules/content/application/dto/form/response/form-answer-key.response.dto';
import { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { FormAnswerKeyRepository } from 'src/modules/content/domain/repositories/form-answer-key.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { GetFormAnswerKeysQuery } from './get-form-answer-keys.query';

@Injectable()
export class GetFormAnswerKeysHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.FormAnswerKeyRepository)
    private readonly answerKeys: FormAnswerKeyRepository,

    private readonly forms: PageBlockFormService,
  ) {}

  async execute(
    query: GetFormAnswerKeysQuery,
  ): Promise<FormAnswerKeyResponseDto[]> {
    const section = await this.pageBlockRepo.findById(query.sectionBlockId);

    if (!section) {
      throw new NotFoundException('Form not found');
    }

    await this.forms.answerKeyDatabase(section, query.userId);
    const questionIds = (
      await this.pageBlockRepo.findActiveChildren(section.getId())
    )
      .filter((child) => child.getType() === PageBlockType.FORM_FIELD)
      .map((child) => child.getId());
    const keys = await this.answerKeys.findByFieldBlockIds(questionIds);

    return keys.map((key) => FormAnswerKeyResponseDto.fromDomain(key));
  }
}
