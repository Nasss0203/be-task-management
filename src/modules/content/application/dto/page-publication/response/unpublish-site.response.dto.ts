import { PagePublication } from 'src/modules/content/domain/entities/page-publication.entity';
import { PublishedSite } from 'src/modules/content/domain/entities/published-site.entity';

export class UnpublishSiteResponseDto {
  published: boolean;
  site_id: string;
  page_id: string;
  subdomain: string;
  path: string;
  unpublished_at: Date | null;

  static fromDomain(
    site: PublishedSite,
    publication: PagePublication,
  ): UnpublishSiteResponseDto {
    const dto = new UnpublishSiteResponseDto();

    dto.published = false;
    dto.site_id = site.getId();
    dto.page_id = publication.getPageId();
    dto.subdomain = site.getSubdomain();
    dto.path = publication.getPath();
    dto.unpublished_at = publication.getUnpublishedAt();

    return dto;
  }
}
