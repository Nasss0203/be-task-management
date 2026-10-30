import { IsObject } from 'class-validator';

export class SubmitFormResponseDto {
  @IsObject()
  answers: Record<string, unknown>;
}
