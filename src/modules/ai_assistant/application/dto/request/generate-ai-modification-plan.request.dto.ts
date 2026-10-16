import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateAiModificationPlanRequestDto {
  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;
}
