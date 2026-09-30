import {
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
export class PublishPageToSiteDto {
  @IsOptional()
  @IsBoolean()
  include_descendants?: boolean;
  @IsUUID()
  page_id: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  path: string;
}
