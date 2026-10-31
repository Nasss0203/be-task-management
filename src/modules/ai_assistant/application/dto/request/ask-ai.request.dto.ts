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

  // M2 (§11 #7): the browser's IANA zone, e.g. "Asia/Ho_Chi_Minh"; an unknown
  // zone falls back to the profile's, then to Việt Nam.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string | null;
}
