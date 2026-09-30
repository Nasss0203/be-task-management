export class PublicSiteNavigationPageResponseDto {
  page_id: string;
  title: string;
  icon: string | null;
  path: string;
  navigation_parent_id: string | null;
}

export class PublicSiteNavigationResponseDto {
  subdomain: string;
  pages: PublicSiteNavigationPageResponseDto[];
}
