import { IsOptional, IsUUID } from 'class-validator';

export class ConfirmPageCompositionRequestDto {
  @IsOptional()
  @IsUUID()
  teamspaceId?: string | null;

  @IsOptional()
  @IsUUID()
  parentPageId?: string | null;
}
