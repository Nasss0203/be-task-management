import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePropertyOptionRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  color?: string | null;
}
