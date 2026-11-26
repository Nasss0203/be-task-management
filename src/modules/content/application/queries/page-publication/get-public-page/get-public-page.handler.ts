import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DatabaseSnapshotReaderPort } from 'src/modules/database/application/ports/database-snapshot-reader.port';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PageBlock } from '../../../../domain/entities/page-block.entity';
import type { PageBlockRepository } from '../../../../domain/repositories/page-block.repository';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import type { PublicDatabaseDto } from '../../../dto/page-publication/response/public-page-block.response.dto';
import { PublicPageResponseDto } from '../../../dto/page-publication/response/public-page.response.dto';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';
import { PublishedSiteThemeService } from '../../../services/published-site-theme.service';
import { GetPublicPageQuery } from './get-public-page.query';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

@Injectable()
export class GetPublicPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,

    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly blocks: PageBlockRepository,

    private readonly availability: PublicationAvailabilityService,

    private readonly authorizationService: AuthorizationService,

    @Inject(DATABASE_TYPES.ports.DatabaseSnapshotReader)
    private readonly databaseSnapshots: DatabaseSnapshotReaderPort,

    private readonly siteTheme: PublishedSiteThemeService,
  ) {}

  async execute(query: GetPublicPageQuery): Promise<PublicPageResponseDto> {
    try {
      const site = await this.sites.findActiveBySubdomain(query.subdomain);

      if (!site) {
        throw new NotFoundException('Published site not found');
      }

      const publication = await this.publications.findActiveBySiteAndPath(
        site.getId(),
        query.path,
      );

      if (!publication) {
        throw new NotFoundException('Published page not found');
      }

      const resolved = await this.availability.resolve(site, publication);

      if (!resolved) {
        throw new NotFoundException('Published page not found');
      }

      const blocks = await this.blocks.findByPageId(resolved.page.getId());

      const result = PublicPageResponseDto.fromDomain(
        resolved.page,
        blocks,
        site.getSubdomain(),
        publication.getPath(),
      );

      for (const dto of result.blocks) {
        if (dto.type !== PageBlockType.DATABASE_VIEW) continue;

        const block = blocks.find((item) => item.getId() === dto.id);

        dto.database = block
          ? await this.publicDatabase(block, resolved.page.getId())
          : null;
      }

      result.breadcrumbs = resolved.breadcrumbs;
      result.seo = site.getSeo();
      const theme = await this.siteTheme.describe(site);
      result.theme = {
        logo_url: theme.logo_url,
        favicon_url: theme.favicon_url,
        accent_color: theme.accent_color,
      };

      const updatesEnabled = site.getAllowUpdates();
      const authenticated = Boolean(query.userId);

      const canUpdate =
        updatesEnabled && query.userId
          ? await this.authorizationService.authorize({
              userId: query.userId,
              permissions: [PERMISSIONS.PAGE_UPDATE],
              target: {
                type: 'page',
                id: resolved.page.getId(),
              },
            })
          : false;

      result.capabilities = {
        updates_enabled: updatesEnabled,
        authenticated,
        can_update: canUpdate,
      };

      return result;
    } catch (error) {
      // Invalid stored shapes must not render a partial public tree.
      if (error instanceof BadRequestException) {
        throw new NotFoundException('Published page not found');
      }

      throw error;
    }
  }

  /**
   * Chỉ database nằm trên chính page được publish mới hiện ra site;
   * view liên kết tới database ở page khác (có thể chưa publish) thì không.
   */
  private async publicDatabase(
    block: PageBlock,
    pageId: string,
  ): Promise<PublicDatabaseDto | null> {
    const config = block.getDataConfig() as {
      database_id?: unknown;
      view_id?: unknown;
    } | null;

    if (typeof config?.database_id !== 'string') return null;

    const snapshot = await this.databaseSnapshots.getDatabaseSnapshot(
      config.database_id,
    );

    if (!snapshot || snapshot.database.pageId !== pageId) return null;

    const view =
      snapshot.views.find((item) => item.id === config.view_id) ??
      snapshot.views[0];

    if (!view) return null;

    return {
      id: snapshot.database.id,
      name: snapshot.database.name,
      view: {
        id: view.id,
        name: view.name,
        type: view.type,
        properties: view.properties.map((property) => ({
          propertyId: property.propertyId,
          position: property.position,
          visible: property.visible,
        })),
      },
      properties: snapshot.properties.map((property) => ({
        id: property.id,
        name: property.name,
        type: property.type,
        isHideable: property.isHideable,
        position: property.position,
        options: property.options.map((option) => ({
          id: option.id,
          name: option.name,
          color: option.color,
        })),
      })),
      rows: snapshot.rows.map((row) => ({
        id: row.id,
        values: row.values.map((value) => ({
          propertyId: value.propertyId,
          value: value.value,
        })),
      })),
    };
  }
}
