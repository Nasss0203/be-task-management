import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PublishSiteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  subdomain: string;
}
