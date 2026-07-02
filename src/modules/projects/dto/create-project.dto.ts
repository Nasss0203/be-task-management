import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { ProjectVisibility } from '../domain/entities/project.entity';

export class CreateProjectDto {
  @IsUUID()
  workspace_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  created_by?: string;
  key?: string;

  @IsOptional()
  @IsBoolean()
  create_default_board?: boolean;

  @IsOptional()
  @IsEnum(BoardViewType)
  default_board_view_type?: BoardViewType;
}
