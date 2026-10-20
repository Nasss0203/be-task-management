import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ResolveAiPageRequestDto {
  @IsUUID()
  workspaceId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsUUID()
  currentPageId?: string;
}
