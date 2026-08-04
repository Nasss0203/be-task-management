import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { AiGenerationType } from '../domain/enums/ai-generation-type.enum';
import { AiProvider } from '../domain/enums/ai-provider.enum';

export class SendAiMessageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @IsOptional()
  @IsUUID()
  workspaceId?: string | null;

  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @IsOptional()
  @IsUUID()
  boardId?: string | null;

  @IsOptional()
  @IsUUID()
  sprintId?: string | null;

  @IsOptional()
  @IsEnum(AiGenerationType)
  generationType?: AiGenerationType;

  /**
   * Provider AI. Hiện chỉ chấp nhận GEMINI.
   * Backend validate và reject mọi provider khác.
   * Nếu bỏ qua, backend tự dùng GEMINI.
   */
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;

  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;
}
