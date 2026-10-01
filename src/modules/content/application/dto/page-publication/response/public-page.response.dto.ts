import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';

import { PublicPageBlockResponseDto } from './public-page-block.response.dto';

export class PublicPageResponseDto {
  breadcrumbs: { page_id: string; title: string; path: string }[];

  subdomain: string;
  path: string;

  page: {
    id: string;
    title: string;
    slug: string | null;
    icon: string | null;
    cover_url: string | null;
    updated_at: Date;
  };

  blocks: PublicPageBlockResponseDto[];

  capabilities: {
    updates_enabled: boolean;
    authenticated: boolean;
    can_update: boolean;
  };

  static fromDomain(
    page: Page,
    blocks: PageBlock[],
    subdomain: string,
    path: string,
  ): PublicPageResponseDto {
    const dto = new PublicPageResponseDto();

    dto.subdomain = subdomain;
    dto.path = path;

    dto.page = {
      id: page.getId(),
      title: page.getTitle(),
      slug: page.getSlug(),
      icon: page.getIcon(),
      cover_url: page.getCoverUrl(),
      updated_at: page.getUpdatedAt(),
    };

    dto.blocks = blocks
      .filter((block) => block.getDeletedAt() === null)
      .sort((a, b) => a.getOrderIndex() - b.getOrderIndex())
      .map((block) => PublicPageBlockResponseDto.fromDomain(block));

    return dto;
  }
}
