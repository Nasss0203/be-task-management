import type {
  TemplateFeedbackSummary,
  TemplateReviewListItem,
} from '../../ports/template-feedback-reader.port';

export interface TemplateFeedbackSummaryDto {
  rating_average: number | null;
  rating_count: number;
  like_count: number;
}

export function toFeedbackSummaryDto(
  summary: TemplateFeedbackSummary | undefined,
): TemplateFeedbackSummaryDto {
  return {
    rating_average: summary?.ratingAverage ?? null,
    rating_count: summary?.ratingCount ?? 0,
    like_count: summary?.likeCount ?? 0,
  };
}

export interface TemplateReviewDto {
  id: string;
  rating: number;
  body: string | null;
  version_number: number | null;
  is_owner: boolean;
  author: { username: string; avatar_url: string | null } | null;
  created_at: Date;
  updated_at: Date;
}

export function toTemplateReviewDto(
  item: TemplateReviewListItem,
): TemplateReviewDto {
  return {
    id: item.id,
    rating: item.rating,
    body: item.body,
    version_number: item.versionNumber,
    is_owner: item.isOwner,
    author: item.author
      ? { username: item.author.username, avatar_url: item.author.avatarUrl }
      : null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export interface TemplateFeedbackViewerDto {
  liked: boolean;
  review: { rating: number; body: string | null } | null;
  is_creator: boolean;
  can_comment: boolean;
}

export interface TemplateReviewsResponseDto extends TemplateFeedbackSummaryDto {
  distribution: number[];
  items: TemplateReviewDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  viewer: TemplateFeedbackViewerDto | null;
}

export interface TemplateLikeResponseDto {
  liked: boolean;
  like_count: number;
}
