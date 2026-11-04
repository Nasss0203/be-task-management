import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const COMMENT_BODY_MAX_LENGTH = 10_000;

export class CreateCommentRequestDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(COMMENT_BODY_MAX_LENGTH)
  body: string;

  /** Trả lời một comment gốc (chỉ một cấp). */
  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;
}
