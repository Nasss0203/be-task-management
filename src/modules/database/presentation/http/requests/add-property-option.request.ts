import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddPropertyOptionRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;
}
