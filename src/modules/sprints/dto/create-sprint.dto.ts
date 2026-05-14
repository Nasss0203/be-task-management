// src/modules/sprints/dto/create-sprint.dto.ts

import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @IsOptional()
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

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds?: string[];
}
