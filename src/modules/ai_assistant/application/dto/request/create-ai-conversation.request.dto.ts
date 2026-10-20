import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';

export class CreateAiConversationRequestDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn([AiConversationScope.GLOBAL, AiConversationScope.PAGE])
  scope?: AiConversationScope;

  @IsOptional()
  @IsUUID()
  pageId?: string | null;

  @IsOptional()
  @IsUUID()
  workspaceId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;
}
