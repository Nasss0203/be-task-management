import { PagePublication } from '../../../../domain/entities/page-publication.entity';
import { PublishedSite } from '../../../../domain/entities/published-site.entity';
import { PagePublicationType } from '../../../../domain/enums/page-publication-type.enum';

export class PagePublicationResponseDto {
  id: string;
  page_id: string;
  site_id: string;
  subdomain: string;
  parent_publication_id: string | null;
  path: string;
  publication_type: PagePublicationType;
  include_descendants: boolean;
  allow_updates: boolean;
  published: boolean;
  published_at: Date;
  unpublished_at: Date | null;
  visibility_override: 'PUBLISHED' | 'UNPUBLISHED' | null;

  static fromDomain(
    publication: PagePublication,
    site: PublishedSite,
    published: boolean,
  ): PagePublicationResponseDto {
    return Object.assign(new PagePublicationResponseDto(), {
      id: publication.getId(),
      page_id: publication.getPageId(),
      site_id: site.getId(),
      subdomain: site.getSubdomain(),
      parent_publication_id: publication.getParentPublicationId(),
      path: publication.getPath(),
      publication_type: publication.getPublicationType(),
      include_descendants: publication.getIncludeDescendants(),
      allow_updates: site.getAllowUpdates(),
      published,
      published_at: publication.getPublishedAt(),
      unpublished_at: publication.getUnpublishedAt(),
      visibility_override: publication.getVisibilityOverride(),
    });
  }
}
