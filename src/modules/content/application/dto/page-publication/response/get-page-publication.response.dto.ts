export class GetPagePublicationResponseDto {
  published: boolean;

  site_id?: string;
  page_id?: string;
  subdomain?: string;
  path?: string;

  published_at?: Date;
  unpublished_at?: Date | null;
}
