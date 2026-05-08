import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectVisibility } from '../domain/entities/project.entity';

export class FindProjectQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
