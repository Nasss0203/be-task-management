import { PublishedSite } from '../../../../domain/entities/published-site.entity';

export class PublishedSiteResponseDto {
  id: string;
  workspace_id: string;
  root_page_id: string;
  subdomain: string;
  disabled_at: Date | null;
  created_at: Date;

  static fromDomain(site: PublishedSite): PublishedSiteResponseDto {
    const dto = new PublishedSiteResponseDto();
    dto.id = site.getId();
    dto.workspace_id = site.getWorkspaceId();
    dto.root_page_id = site.getRootPageId();
    dto.subdomain = site.getSubdomain();
    dto.disabled_at = site.getDisabledAt();
    dto.created_at = site.getCreatedAt();
    return dto;
  }
}
