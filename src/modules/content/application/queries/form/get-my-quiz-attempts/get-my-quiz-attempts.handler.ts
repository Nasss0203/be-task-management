import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FormQuizAttemptResponseDto,
  type MyQuizAttemptsResponseDto,
} from 'src/modules/content/application/dto/form/response/form-quiz-attempts.response.dto';
import { sectionQuizOf } from 'src/modules/content/application/services/page-block-form.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { FormQuizAttemptRepository } from 'src/modules/content/domain/repositories/form-quiz-attempt.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { GetMyQuizAttemptsQuery } from './get-my-quiz-attempts.query';

@Injectable()
export class GetMyQuizAttemptsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.FormQuizAttemptRepository)
    private readonly quizAttempts: FormQuizAttemptRepository,
  ) {}

  async execute(
    query: GetMyQuizAttemptsQuery,
  ): Promise<MyQuizAttemptsResponseDto> {
    const section = await this.pageBlockRepo.findById(query.sectionBlockId);

    if (!section) {
      throw new NotFoundException('Form not found');
    }

    const quiz =
      section.getType() === PageBlockType.SECTION
        ? sectionQuizOf(section.getDataConfig())
        : null;

    if (!quiz) {
      throw new BadRequestException('This form is not a quiz');
    }

    const attempts = await this.quizAttempts.findBySectionAndUser(
      section.getId(),
      query.userId,
    );

    return {
      max_attempts: quiz.maxAttempts,
      attempts_left: quiz.maxAttempts
        ? Math.max(quiz.maxAttempts - attempts.length, 0)
        : null,
      attempts: attempts.map((attempt) =>
        FormQuizAttemptResponseDto.fromDomain(attempt, quiz.showResult),
      ),
    };
  }
}
