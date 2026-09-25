import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SubmitAiMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  capability: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  input?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  context?: Record<string, unknown>;
}
