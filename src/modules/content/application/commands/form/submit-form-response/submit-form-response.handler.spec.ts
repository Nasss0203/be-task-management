import { ForbiddenException } from '@nestjs/common';
import type { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';
import { FormQuizAttempt } from 'src/modules/content/domain/entities/form-quiz-attempt.entity';
import type { FormAnswerKeyRepository } from 'src/modules/content/domain/repositories/form-answer-key.repository';
import type { FormQuizAttemptRepository } from 'src/modules/content/domain/repositories/form-quiz-attempt.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import type { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { SubmitFormResponseCommand } from './submit-form-response.command';
import { SubmitFormResponseHandler } from './submit-form-response.handler';

const property = (id: string, type = PropertyType.TEXT) => ({
  getId: () => id,
  getName: () => id,
  getType: () => type,
  getOptions: () => [],
});

const previousAttempt = (attemptNo: number) =>
  FormQuizAttempt.restore({
    id: `attempt-${attemptNo}`,
    sectionBlockId: 'section',
    userId: 'user',
    attemptNo,
    rowId: null,
    score: 0,
    maxScore: 1,
    results: [],
    createdAt: new Date(),
  });

const setup = ({
  respondentPropertyId = null as string | null,
  quiz = undefined as Record<string, unknown> | undefined,
  attempts = [] as FormQuizAttempt[],
} = {}) => {
  const setRowValue = { execute: jest.fn() };
  const createRow = { execute: jest.fn().mockResolvedValue({ id: 'row' }) };
  const quizAttemptRepo = {
    findBySectionAndUser: jest.fn().mockResolvedValue(attempts),
    save: jest.fn<Promise<FormQuizAttempt>, [FormQuizAttempt, unknown]>(),
  };
  const answerKeyRepo = {
    findByFieldBlockIds: jest.fn().mockResolvedValue([
      FormAnswerKey.create({
        fieldBlockId: 'city-block',
        correctValue: 'Hue',
        points: 2,
      }),
    ]),
  };

  const handler = new SubmitFormResponseHandler(
    {
      findById: jest.fn().mockResolvedValue({
        getId: () => 'section',
        getDataConfig: () => (quiz ? { quiz } : {}),
      }),
      findActiveChildren: jest.fn().mockResolvedValue(
        quiz
          ? [
              {
                getId: () => 'city-block',
                getType: () => PageBlockType.FORM_FIELD,
                getDataConfig: () => ({ property_id: 'city' }),
                getContent: () => ({ label: 'City' }),
              },
            ]
          : [],
      ),
    } as unknown as PageBlockRepository,
    {
      runInTransaction: (work: (context: unknown) => unknown) => work({}),
    } as unknown as UnitOfWork,
    {
      formDatabase: jest.fn().mockResolvedValue({
        form: { respondentPropertyId, successMessage: null },
        database: {
          getId: () => 'db',
          getProperties: () => [
            property('person'),
            property('city'),
            property('score', PropertyType.NUMBER),
          ],
        },
      }),
    } as unknown as PageBlockFormService,
    createRow as unknown as CreateDatabaseRowHandler,
    setRowValue as unknown as SetRowValueHandler,
    answerKeyRepo as unknown as FormAnswerKeyRepository,
    quizAttemptRepo as unknown as FormQuizAttemptRepository,
  );

  const submit = (answers: Record<string, unknown> = {}) =>
    handler.execute(new SubmitFormResponseCommand('section', answers, 'user'));

  return { submit, setRowValue, createRow, quizAttemptRepo };
};

describe('SubmitFormResponseHandler', () => {
  it('records who submitted when the form has a respondent column', async () => {
    const { submit, setRowValue } = setup({ respondentPropertyId: 'person' });
    await submit();

    expect(setRowValue.execute).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 'person', value: ['user'] }),
      expect.anything(),
    );
  });

  it('records nobody on a form without one', async () => {
    const { submit, setRowValue } = setup();
    await submit();

    expect(setRowValue.execute).not.toHaveBeenCalled();
  });

  it('ignores a respondent column that was deleted', async () => {
    const { submit, setRowValue } = setup({ respondentPropertyId: 'gone' });
    await submit();

    expect(setRowValue.execute).not.toHaveBeenCalled();
  });

  describe('quiz', () => {
    const quiz = {
      show_result: 'score',
      max_attempts: 2,
      score_property_id: 'score',
    };

    it('does not grade a form without quiz', async () => {
      const { submit, quizAttemptRepo } = setup();

      expect((await submit()).quiz).toBeNull();
      expect(quizAttemptRepo.save).not.toHaveBeenCalled();
    });

    it('saves the next attempt and copies the score into the row', async () => {
      const { submit, quizAttemptRepo, setRowValue } = setup({
        quiz,
        attempts: [previousAttempt(1)],
      });

      const result = await submit({ city: 'hue' });

      expect(result.quiz).toEqual({
        attempt_no: 2,
        score: 2,
        max_score: 2,
        results: null,
      });
      const saved = quizAttemptRepo.save.mock.calls[0][0];
      expect(saved.getAttemptNo()).toBe(2);
      expect(saved.getRowId()).toBe('row');
      expect(setRowValue.execute).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: 'score', value: 2 }),
        expect.anything(),
      );
    });

    it('returns each question only when show_result is results', async () => {
      const { submit } = setup({ quiz: { ...quiz, show_result: 'results' } });

      expect((await submit({ city: 'Hanoi' })).quiz?.results).toEqual([
        { property_id: 'city', is_correct: false, points: 2 },
      ]);
    });

    it('hides the score when show_result is none but still saves it', async () => {
      const { submit, quizAttemptRepo } = setup({
        quiz: { ...quiz, show_result: 'none' },
      });

      expect((await submit({ city: 'Hue' })).quiz).toBeNull();
      expect(quizAttemptRepo.save).toHaveBeenCalled();
    });

    it('refuses an attempt over max_attempts before creating a row', async () => {
      const { submit, createRow } = setup({
        quiz,
        attempts: [previousAttempt(1), previousAttempt(2)],
      });

      await expect(submit({ city: 'Hue' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(createRow.execute).not.toHaveBeenCalled();
    });
  });
});
