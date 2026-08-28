import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  PageBlockType,
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';
export class UpdatePageBlockDto {
  @IsOptional()
  @IsEnum(PageBlockType)
  type?: PageBlockType;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsInt()
  position_x?: number | null;

  @IsOptional()
  @IsInt()
  position_y?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number | null;

  @IsOptional()
  content?: PageBlockJson;

  @IsOptional()
  @IsObject()
  style_config?: PageBlockStyleConfig;

  @IsOptional()
  data_config?: PageBlockJson;

  @IsOptional()
  @IsBoolean()
  is_open?: boolean;
}
