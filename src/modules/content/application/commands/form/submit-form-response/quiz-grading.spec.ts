import { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { FormQuestion } from './form-answers';
import { gradeQuiz } from './quiz-grading';

const question = (
  propertyId: string,
  type: PropertyType,
  optionIds?: string[],
): FormQuestion => ({
  propertyId,
  blockId: `${propertyId}-block`,
  label: propertyId,
  required: false,
  type,
  optionIds,
});

const key = (propertyId: string, correctValue: RowValueData, points = 1) =>
  FormAnswerKey.create({
    fieldBlockId: `${propertyId}-block`,
    correctValue,
    points,
  });

describe('gradeQuiz', () => {
  it('accepts multi select answers in any order but not partial ones', () => {
    const skills = question('skills', PropertyType.MULTI_SELECT, [
      'a',
      'b',
      'c',
    ]);
    const keys = [key('skills', ['a', 'b'], 2)];

    expect(gradeQuiz([skills], keys, { skills: ['b', 'a'] }).score).toBe(2);
    expect(gradeQuiz([skills], keys, { skills: ['a'] }).score).toBe(0);
    expect(gradeQuiz([skills], keys, { skills: ['a', 'b', 'c'] }).score).toBe(
      0,
    );
  });

  it('counts an unticked checkbox as the answer false', () => {
    const agree = question('agree', PropertyType.CHECKBOX);

    expect(gradeQuiz([agree], [key('agree', false)], {}).score).toBe(1);
    expect(gradeQuiz([agree], [key('agree', true)], {}).score).toBe(0);
  });

  it('ignores case and surrounding spaces in text answers', () => {
    const city = question('city', PropertyType.TEXT);

    expect(
      gradeQuiz([city], [key('city', 'Ha Noi')], { city: ' ha noi ' }).score,
    ).toBe(1);
  });

  it('drops a question whose correct option was deleted', () => {
    const team = question('team', PropertyType.SELECT, ['kept']);
    const city = question('city', PropertyType.TEXT);

    const grade = gradeQuiz(
      [team, city],
      [key('team', 'deleted', 5), key('city', 'Hue', 2)],
      { team: 'kept' },
    );

    expect(grade.results.map((result) => result.property_id)).toEqual(['city']);
    expect(grade.maxScore).toBe(2);
  });

  it('counts an unanswered question as wrong and keeps its points in the max', () => {
    const age = question('age', PropertyType.NUMBER);
    const city = question('city', PropertyType.TEXT);

    const grade = gradeQuiz(
      [age, city],
      [key('age', 18, 3), key('city', 'Hue', 2)],
      { age: 18 },
    );

    expect(grade).toEqual({
      score: 3,
      maxScore: 5,
      results: [
        { property_id: 'age', is_correct: true, points: 3 },
        { property_id: 'city', is_correct: false, points: 2 },
      ],
    });
  });
});
