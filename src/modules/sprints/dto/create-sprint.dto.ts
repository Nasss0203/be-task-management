// src/modules/sprints/dto/create-sprint.dto.ts

import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  goal?: string;

  @IsDateString()
  @IsOptional()
  startAt?: string | null;

  @IsDateString()
  @IsOptional()
  endAt?: string | null;
}
