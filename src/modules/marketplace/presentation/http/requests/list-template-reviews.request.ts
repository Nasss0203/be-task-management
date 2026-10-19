import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ListTemplateReviewsRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
