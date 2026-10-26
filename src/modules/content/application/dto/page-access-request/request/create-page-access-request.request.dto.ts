import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

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
}
