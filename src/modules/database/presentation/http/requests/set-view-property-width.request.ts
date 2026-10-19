import { IsInt, Max, Min, ValidateIf } from 'class-validator';

export class SetViewPropertyWidthRequest {
  // null resets the column to its default width.
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(80)
  @Max(1200)
  width: number | null;
}
