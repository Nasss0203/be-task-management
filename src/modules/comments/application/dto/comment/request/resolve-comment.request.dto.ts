import { IsBoolean } from 'class-validator';

export class ResolveCommentRequestDto {
  @IsBoolean()
  resolved: boolean;
}
