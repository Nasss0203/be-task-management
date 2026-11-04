import { BadRequestException } from '@nestjs/common';
import { FormQuizAttempt } from 'src/modules/content/domain/entities/form-quiz-attempt.entity';
import type { FormQuizAttemptRepository } from 'src/modules/content/domain/repositories/form-quiz-attempt.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { GetMyQuizAttemptsHandler } from './get-my-quiz-attempts.handler';
import { GetMyQuizAttemptsQuery } from './get-my-quiz-attempts.query';

const attempt = (attemptNo: number) =>
  FormQuizAttempt.restore({
    id: `attempt-${attemptNo}`,
    sectionBlockId: 'section',
    userId: 'user',
    attemptNo,
    rowId: 'row',
    score: 3,
    maxScore: 5,
    results: [{ property_id: 'city', is_correct: true, points: 3 }],
    createdAt: new Date('2026-11-04T00:00:00Z'),
  });

const setup = (
  dataConfig: Record<string, unknown>,
  type = PageBlockType.SECTION,
  attempts = [attempt(1)],
) => {
  const quizAttempts = {
    findBySectionAndUser: jest.fn().mockResolvedValue(attempts),
  };
  const handler = new GetMyQuizAttemptsHandler(
    {
      findById: jest.fn().mockResolvedValue({
        getId: () => 'section',
        getType: () => type,
        getDataConfig: () => dataConfig,
      }),
    } as unknown as PageBlockRepository,
    quizAttempts as unknown as FormQuizAttemptRepository,
  );

  return {
    get: () => handler.execute(new GetMyQuizAttemptsQuery('section', 'user')),
    quizAttempts,
  };
};

const quiz = (show_result: string, max_attempts?: number) => ({
  quiz: { show_result, max_attempts, score_property_id: 'score' },
});

describe('GetMyQuizAttemptsHandler', () => {
  it('rejects a section without quiz and a block that is not a section', async () => {
    await expect(setup({}).get()).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      setup(quiz('score'), PageBlockType.TEXT).get(),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reads only the attempts of the asking user', async () => {
    const { get, quizAttempts } = setup(quiz('score'));
    await get();

    expect(quizAttempts.findBySectionAndUser).toHaveBeenCalledWith(
      'section',
      'user',
    );
  });

  it('shows the score without each question when show_result is score', async () => {
    expect(await setup(quiz('score', 3)).get()).toEqual({
      max_attempts: 3,
      attempts_left: 2,
      attempts: [
        {
          attempt_no: 1,
          score: 3,
          max_score: 5,
          results: null,
          created_at: new Date('2026-11-04T00:00:00Z'),
        },
      ],
    });
  });

  it('shows each question when show_result is results', async () => {
    const { attempts } = await setup(quiz('results')).get();

    expect(attempts[0].results).toEqual([
      { property_id: 'city', is_correct: true, points: 3 },
    ]);
  });

  it('hides the score when show_result is none and has no limit without max_attempts', async () => {
    const result = await setup(quiz('none')).get();

    expect(result.attempts_left).toBeNull();
    expect(result.attempts[0]).toMatchObject({ score: null, max_score: null });
  });

  it('never reports negative attempts left after max_attempts is lowered', async () => {
    const { attempts_left } = await setup(
      quiz('score', 1),
      PageBlockType.SECTION,
      [attempt(1), attempt(2)],
    ).get();

    expect(attempts_left).toBe(0);
  });
});
