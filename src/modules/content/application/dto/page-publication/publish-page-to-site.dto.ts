import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
export class PublishPageToSiteDto {
  @IsUUID()
  page_id: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  path: string;
}
