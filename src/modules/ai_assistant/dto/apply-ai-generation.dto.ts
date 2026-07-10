import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AiAppliedEntityType } from '../domain/enums/ai-applied-entity-type.enum';

export class AiAppliedResultDto {
  @IsEnum(AiAppliedEntityType)
  entityType: AiAppliedEntityType;

  @IsUUID()
  entityId: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}

export class ApplyAiGenerationDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiAppliedResultDto)
  appliedResults?: AiAppliedResultDto[];
}
