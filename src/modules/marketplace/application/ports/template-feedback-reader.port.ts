import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export interface TemplateFeedbackSummary {
  ratingAverage: number | null;
  ratingCount: number;
  likeCount: number;
}

export interface TemplateReviewListItem {
  id: string;
  rating: number;
  body: string | null;
  versionNumber: number | null;
  isOwner: boolean;
  author: { username: string; avatarUrl: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFeedbackViewer {
  liked: boolean;
  review: { rating: number; body: string | null } | null;
  isOwner: boolean;
}

export interface TemplateFeedbackReader {
  getSummaries(
    templateIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, TemplateFeedbackSummary>>;

  getRatingDistribution(templateId: string): Promise<number[]>;

  listReviews(
    templateId: string,
    page: number,
    limit: number,
  ): Promise<{ items: TemplateReviewListItem[]; total: number }>;

  getViewer(
    templateId: string,
    userId: string,
  ): Promise<TemplateFeedbackViewer>;

  hasEntitlement(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
