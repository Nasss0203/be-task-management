import type { QuizShowResult } from 'src/modules/content/application/services/page-block-form.service';
import type {
  FormQuizAttempt,
  FormQuizResult,
} from 'src/modules/content/domain/entities/form-quiz-attempt.entity';

export class FormQuizAttemptResponseDto {
  attempt_no: number;
  score: number | null;
  max_score: number | null;
  results: FormQuizResult[] | null;
  created_at: Date;

  static fromDomain(
    attempt: FormQuizAttempt,
    showResult: QuizShowResult,
  ): FormQuizAttemptResponseDto {
    const showScore = showResult !== 'none';

    return {
      attempt_no: attempt.getAttemptNo(),
      score: showScore ? attempt.getScore() : null,
      max_score: showScore ? attempt.getMaxScore() : null,
      results: showResult === 'results' ? attempt.getResults() : null,
      created_at: attempt.getCreatedAt(),
    };
  }
}

export class MyQuizAttemptsResponseDto {
  max_attempts: number | null;
  attempts_left: number | null;
  attempts: FormQuizAttemptResponseDto[];
}
