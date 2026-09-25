import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAiConversationRequestDto {
  @IsOptional()
  @IsUUID()
  workspaceId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;
}
