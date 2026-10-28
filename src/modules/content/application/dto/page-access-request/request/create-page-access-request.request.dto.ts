import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreatePageAccessRequestRequestDto {
  @ValidateIf((dto: CreatePageAccessRequestRequestDto) => !dto.subdomain)
  @IsString()
  @IsNotEmpty()
  token?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subdomain?: string;

  @ValidateIf((dto: CreatePageAccessRequestRequestDto) =>
    Boolean(dto.subdomain),
  )
  @IsString()
  @IsNotEmpty()
  path?: string;

  /** `edit` khi người chỉ xem được qua link xin quyền sửa. */
  @IsOptional()
  @IsIn(['view', 'edit'])
  intent?: 'view' | 'edit';
}
