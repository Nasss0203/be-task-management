import type { FormAnswerKey } from 'src/modules/content/domain/entities/form-answer-key.entity';
import type { FormQuizResult } from 'src/modules/content/domain/entities/form-quiz-attempt.entity';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { FormQuestion } from './form-answers';

export interface QuizGrade {
  score: number;
  maxScore: number;
  results: FormQuizResult[];
}

function keyStillFits(question: FormQuestion, expected: unknown): boolean {
  const options = question.optionIds ?? [];

  switch (question.type) {
    case PropertyType.SELECT:
    case PropertyType.STATUS:
      return options.includes(expected as string);
    case PropertyType.MULTI_SELECT:
      return (
        Array.isArray(expected) &&
        expected.every((id) => options.includes(id as string))
      );
    default:
      return true;
  }
}

function isCorrect(
  question: FormQuestion,
  expected: unknown,
  answer: unknown,
): boolean {
  switch (question.type) {
    case PropertyType.MULTI_SELECT: {
      if (!Array.isArray(expected) || !Array.isArray(answer)) return false;
      const given = new Set(answer);
      return (
        given.size === expected.length && expected.every((id) => given.has(id))
      );
    }
    case PropertyType.CHECKBOX:
      return (answer === true) === expected;
    case PropertyType.TITLE:
    case PropertyType.TEXT:
      return (
        typeof answer === 'string' &&
        typeof expected === 'string' &&
        answer.trim().toLowerCase() === expected.trim().toLowerCase()
      );
    default:
      return answer === expected;
  }
}

export function gradeQuiz(
  questions: FormQuestion[],
  keys: FormAnswerKey[],
  answers: Record<string, unknown>,
): QuizGrade {
  const keyByBlock = new Map(keys.map((key) => [key.getFieldBlockId(), key]));

  const results: FormQuizResult[] = questions.flatMap((question) => {
    const key = question.blockId ? keyByBlock.get(question.blockId) : undefined;
    if (!key || !keyStillFits(question, key.getCorrectValue())) return [];

    return [
      {
        property_id: question.propertyId,
        is_correct: isCorrect(
          question,
          key.getCorrectValue(),
          answers[question.propertyId],
        ),
        points: key.getPoints(),
      },
    ];
  });

  return {
    score: results.reduce(
      (sum, result) => sum + (result.is_correct ? result.points : 0),
      0,
    ),
    maxScore: results.reduce((sum, result) => sum + result.points, 0),
    results,
  };
}
