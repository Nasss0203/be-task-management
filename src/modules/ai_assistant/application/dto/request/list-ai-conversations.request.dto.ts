import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';

export class ListAiConversationsRequestDto {
  @IsOptional()
  @IsEnum(AiConversationScope)
  scope?: AiConversationScope;

  @IsOptional()
  @IsUUID()
  pageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  shareToken?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  cursor?: string;
}
