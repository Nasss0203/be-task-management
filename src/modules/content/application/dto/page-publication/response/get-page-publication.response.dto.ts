import type { PublishedSiteThemeView } from '../../../services/published-site-theme.service';

export class GetPagePublicationResponseDto {
  published: boolean;

  site_id?: string;
  page_id?: string;
  subdomain?: string;
  site_active?: boolean;
  allow_updates?: boolean;
  seo?: { title: string | null; description: string | null; indexing: boolean };
  theme?: PublishedSiteThemeView;
  path?: string;

  published_at?: Date;
  unpublished_at?: Date | null;
}
