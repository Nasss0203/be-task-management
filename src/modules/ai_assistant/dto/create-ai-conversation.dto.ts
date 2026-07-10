import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAiConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string | null;
}
