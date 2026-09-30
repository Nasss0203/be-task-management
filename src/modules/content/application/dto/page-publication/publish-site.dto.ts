import {
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class PublishSiteDto {
  @IsOptional()
  @IsBoolean()
  include_descendants?: boolean;
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  subdomain: string;
}
