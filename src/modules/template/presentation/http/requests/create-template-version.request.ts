import { IsOptional, IsUUID } from 'class-validator';

export class CreateTemplateVersionRequest {
  @IsOptional()
  @IsUUID()
  source_page_id?: string;
}
