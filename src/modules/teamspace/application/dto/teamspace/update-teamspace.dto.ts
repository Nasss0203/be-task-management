import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTeamspaceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string | null;
}
