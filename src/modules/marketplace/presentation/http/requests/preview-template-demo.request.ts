import { IsNotEmpty, IsObject, IsUUID, ValidateIf } from 'class-validator';

export class PreviewTemplateDemoRequest {
  @IsNotEmpty()
  @IsUUID()
  demo_version_id: string;

  // The schema itself is validated by TemplateDemoConfig.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsObject()
  demo_config?: Record<string, any> | null;
}
