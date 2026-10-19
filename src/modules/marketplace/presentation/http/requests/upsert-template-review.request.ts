import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { MAX_REVIEW_BODY_LENGTH } from '../../../domain/entities/template-review.entity';

export class UpsertTemplateReviewRequest {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_REVIEW_BODY_LENGTH)
  body?: string | null;
}
