import { PagePublication } from 'src/modules/content/domain/entities/page-publication.entity';
import { PublishedSite } from 'src/modules/content/domain/entities/published-site.entity';

export class PublishSiteResponseDto {
  site_id: string;
  page_id: string;
  subdomain: string;
  path: string;
  published_at: Date;

  static fromDomain(
    site: PublishedSite,
    publication: PagePublication,
  ): PublishSiteResponseDto {
    const dto = new PublishSiteResponseDto();

    dto.site_id = site.getId();
    dto.page_id = publication.getPageId();
    dto.subdomain = site.getSubdomain();
    dto.path = publication.getPath();
    dto.published_at = publication.getPublishedAt();

    return dto;
  }
}
