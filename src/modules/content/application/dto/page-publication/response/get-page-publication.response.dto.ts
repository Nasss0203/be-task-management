export class GetPagePublicationResponseDto {
  published: boolean;

  site_id?: string;
  page_id?: string;
  subdomain?: string;
  site_active?: boolean;
  allow_updates?: boolean;
  path?: string;

  published_at?: Date;
  unpublished_at?: Date | null;
}
