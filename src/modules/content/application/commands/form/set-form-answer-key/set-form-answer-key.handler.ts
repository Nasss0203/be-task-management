import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertAnswerKeyValue,
  formFieldOf,
  PageBlockFormService,
  QUIZ_PROPERTY_TYPES,
} from 'src/modules/content/application/services/page-block-form.service';
import { FormAnswerKeyResponseDto } from 'src/modules/content/application/dto/form/response/form-answer-key.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';
import type { FormAnswerKeyRepository } from 'src/modules/content/domain/repositories/form-answer-key.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { SetFormAnswerKeyCommand } from './set-form-answer-key.command';

@Injectable()
export class SetFormAnswerKeyHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.FormAnswerKeyRepository)
    private readonly answerKeys: FormAnswerKeyRepository,

    private readonly forms: PageBlockFormService,
  ) {}

  async execute(
    command: SetFormAnswerKeyCommand,
  ): Promise<FormAnswerKeyResponseDto> {
    const [section, question] = await Promise.all([
      this.pageBlockRepo.findById(command.sectionBlockId),
      this.pageBlockRepo.findById(command.fieldBlockId),
    ]);

    if (!section) {
      throw new NotFoundException('Form not found');
    }

    const database = await this.forms.answerKeyDatabase(
      section,
      command.userId,
    );
    const field =
      question?.getType() === PageBlockType.FORM_FIELD &&
      question.getParentBlockId() === section.getId()
        ? formFieldOf(question.getDataConfig())
        : null;

    if (!question || !field) {
      throw new NotFoundException('Question not found in this form');
    }

    if (command.correctValue === null) {
      await this.answerKeys.deleteByFieldBlockId(question.getId());
      return FormAnswerKeyResponseDto.removed(question.getId());
    }

    const property = database
      .getProperties()
      .find((item) => item.getId() === field.propertyId);

    if (!property || !QUIZ_PROPERTY_TYPES.has(property.getType())) {
      throw new BadRequestException('This question cannot be graded');
    }

    if (field.optionConditions) {
      throw new BadRequestException(
        'A question whose options depend on another answer cannot be graded yet',
      );
    }

    assertAnswerKeyValue(property, command.correctValue);

    const saved = await this.answerKeys.save(
      FormAnswerKey.create({
        fieldBlockId: question.getId(),
        correctValue: command.correctValue as RowValueData,
        points: command.points,
      }),
    );

    return FormAnswerKeyResponseDto.fromDomain(saved);
  }
}
