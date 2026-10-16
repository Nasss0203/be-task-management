import { TemplateVersion } from '../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateVersionStatus } from '../../../domain/enums/template-version-status.enum';

export class TemplateVersionResponseDto {
  id: string;
  template_id: string;
  version_number: number;
  status: TemplateVersionStatus;
  created_by: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;

  static fromDomain(version: TemplateVersion): TemplateVersionResponseDto {
    const dto = new TemplateVersionResponseDto();

    dto.id = version.getId();
    dto.template_id = version.getTemplateId();
    dto.version_number = version.getVersionNumber();
    dto.status = version.getStatus();
    dto.created_by = version.getCreatedBy();
    dto.published_at = version.getPublishedAt();
    dto.created_at = version.getCreatedAt();
    dto.updated_at = version.getUpdatedAt();

    return dto;
  }
}
