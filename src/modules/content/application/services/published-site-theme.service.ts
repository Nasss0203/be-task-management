import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from '../../content.types';
import type {
  PublishedSite,
  PublishedSiteThemeChanges,
} from '../../domain/entities/published-site.entity';
import type {
  SiteThemeImage,
  SiteThemeImageReader,
} from '../ports/site-theme-image-reader.port';

export const SITE_THEME_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
export const SITE_THEME_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export type PublishedSiteThemeView = {
  logo_attachment_id: string | null;
  logo_url: string | null;
  favicon_attachment_id: string | null;
  favicon_url: string | null;
  accent_color: string | null;
};

function isUsable(image: SiteThemeImage): boolean {
  return (
    SITE_THEME_IMAGE_MIME_TYPES.includes(image.mimeType) &&
    image.size <= SITE_THEME_IMAGE_MAX_BYTES
  );
}

@Injectable()
export class PublishedSiteThemeService {
  constructor(
    @Inject(CONTENT_TYPES.ports.SiteThemeImageReader)
    private readonly images: SiteThemeImageReader,
  ) {}

  async assertUsableImages(
    workspaceId: string,
    changes: PublishedSiteThemeChanges,
  ): Promise<void> {
    const ids = [changes.logoAttachmentId, changes.faviconAttachmentId].filter(
      (id): id is string => Boolean(id),
    );
    if (ids.length === 0) return;

    const found = await this.images.findReadyImages(workspaceId, ids);
    const usable = ids.every((id) =>
      found.some((image) => image.id === id && isUsable(image)),
    );
    if (!usable)
      throw new BadRequestException(
        'Site logo and favicon must be PNG, JPEG, WebP or GIF images up to 2 MB uploaded to this workspace',
      );
  }

  async describe(site: PublishedSite): Promise<PublishedSiteThemeView> {
    const theme = site.getTheme();
    const ids = [theme.logoAttachmentId, theme.faviconAttachmentId].filter(
      (id): id is string => Boolean(id),
    );
    const found =
      ids.length === 0
        ? []
        : await this.images.findReadyImages(site.getWorkspaceId(), ids);
    const urlOf = (id: string | null) =>
      found.find((image) => image.id === id && isUsable(image))?.url ?? null;

    return {
      logo_attachment_id: theme.logoAttachmentId,
      logo_url: urlOf(theme.logoAttachmentId),
      favicon_attachment_id: theme.faviconAttachmentId,
      favicon_url: urlOf(theme.faviconAttachmentId),
      accent_color: theme.accentColor,
    };
  }
}
