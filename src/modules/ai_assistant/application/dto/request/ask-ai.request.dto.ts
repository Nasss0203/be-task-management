import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class AskAiRequestDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @Matches(/\S/u)
  @MaxLength(4000)
  instruction: string;

  @IsOptional()
  @IsString()
  @Matches(/\S/u)
  @MaxLength(8000)
  selectedText?: string | null;

  @IsOptional()
  @IsUUID()
  currentPageId?: string | null;

  @IsOptional()
  @IsUUID()
  selectedPageId?: string | null;

  @IsOptional()
  @IsUUID()
  conversationId?: string | null;

  @IsOptional()
  @IsUUID()
  requestId?: string | null;
}
