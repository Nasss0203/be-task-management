import { randomUUID } from 'node:crypto';

export const MAX_REVIEW_BODY_LENGTH = 2000;

export interface CreateTemplateReviewParams {
  templateId: string;
  userId: string;
  versionId: string;
  rating: number;
  body?: string | null;
}

export interface ReconstituteTemplateReviewParams {
  id: string;
  templateId: string;
  userId: string;
  versionId: string;
  rating: number;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function assertRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer from 1 to 5');
  }
}

function normalizeBody(body: string | null | undefined): string | null {
  const trimmed = body?.trim() ?? '';

  if (trimmed.length > MAX_REVIEW_BODY_LENGTH) {
    throw new Error(
      `Review must be at most ${MAX_REVIEW_BODY_LENGTH} characters`,
    );
  }

  return trimmed || null;
}

export class TemplateReview {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private readonly userId: string,
    private versionId: string,
    private rating: number,
    private body: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: CreateTemplateReviewParams): TemplateReview {
    if (!params.templateId || !params.userId || !params.versionId) {
      throw new Error('Review identifiers are required');
    }

    assertRating(params.rating);
    const now = new Date();

    return new TemplateReview(
      randomUUID(),
      params.templateId,
      params.userId,
      params.versionId,
      params.rating,
      normalizeBody(params.body),
      now,
      now,
    );
  }

  static reconstitute(
    params: ReconstituteTemplateReviewParams,
  ): TemplateReview {
    return new TemplateReview(
      params.id,
      params.templateId,
      params.userId,
      params.versionId,
      params.rating,
      params.body,
      params.createdAt,
      params.updatedAt,
    );
  }

  update(params: {
    versionId: string;
    rating: number;
    body?: string | null;
  }): void {
    assertRating(params.rating);
    this.body = normalizeBody(params.body);
    this.rating = params.rating;
    this.versionId = params.versionId;
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getTemplateId(): string {
    return this.templateId;
  }

  getUserId(): string {
    return this.userId;
  }

  getVersionId(): string {
    return this.versionId;
  }

  getRating(): number {
    return this.rating;
  }

  getBody(): string | null {
    return this.body;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
