import type {
  PublishedSiteSeoChanges,
  PublishedSiteThemeChanges,
} from '../../../../domain/entities/published-site.entity';

export class UpdatePagePublicationSettingsCommand {
  constructor(
    public readonly actorId: string,
    public readonly pageId: string,
    public readonly siteId: string | undefined,
    public readonly includeDescendants?: boolean,
    public readonly allowUpdates?: boolean,
    public readonly seo: PublishedSiteSeoChanges = {},
    public readonly theme: PublishedSiteThemeChanges = {},
  ) {}
}
