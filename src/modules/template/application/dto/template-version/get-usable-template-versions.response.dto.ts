import { TemplateVersionStatus } from '../../../domain/enums/template-version-status.enum';

export interface GetUsableTemplateVersionsResponseDto {
  items: {
    id: string;
    version_number: number;
    status: TemplateVersionStatus;
    released_at: Date;
    is_current: boolean;
  }[];
}
