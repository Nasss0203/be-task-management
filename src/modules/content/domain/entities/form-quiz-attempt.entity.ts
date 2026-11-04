export interface FormQuizResult {
  property_id: string;
  is_correct: boolean;
  points: number;
}

export class FormQuizAttempt {
  private constructor(
    private readonly id: string,
    private readonly sectionBlockId: string,
    private readonly userId: string,
    private readonly attemptNo: number,
    private readonly rowId: string | null,
    private readonly score: number,
    private readonly maxScore: number,
    private readonly results: FormQuizResult[],
    private readonly createdAt: Date,
  ) {}

  static create(params: {
    sectionBlockId: string;
    userId: string;
    attemptNo: number;
    rowId: string;
    score: number;
    maxScore: number;
    results: FormQuizResult[];
  }): FormQuizAttempt {
    return new FormQuizAttempt(
      crypto.randomUUID(),
      params.sectionBlockId,
      params.userId,
      params.attemptNo,
      params.rowId,
      params.score,
      params.maxScore,
      params.results,
      new Date(),
    );
  }

  static restore(params: {
    id: string;
    sectionBlockId: string;
    userId: string;
    attemptNo: number;
    rowId: string | null;
    score: number;
    maxScore: number;
    results: FormQuizResult[];
    createdAt: Date;
  }): FormQuizAttempt {
    return new FormQuizAttempt(
      params.id,
      params.sectionBlockId,
      params.userId,
      params.attemptNo,
      params.rowId,
      params.score,
      params.maxScore,
      params.results,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getSectionBlockId(): string {
    return this.sectionBlockId;
  }

  getUserId(): string {
    return this.userId;
  }

  getAttemptNo(): number {
    return this.attemptNo;
  }

  getRowId(): string | null {
    return this.rowId;
  }

  getScore(): number {
    return this.score;
  }

  getMaxScore(): number {
    return this.maxScore;
  }

  getResults(): FormQuizResult[] {
    return this.results;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
