import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

@Injectable()
export class ListSitePublicationsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    private readonly authorization: AuthorizationService,
  ) {}
  async execute(siteId: string, userId: string) {
    const site = await this.sites.findById(siteId);
    if (!site) throw new NotFoundException('Published site not found');
    if (
      !(await this.authorization.authorize({
        userId,
        permissions: [PERMISSIONS.PAGE_UPDATE],
        target: { type: 'page', id: site.getRootPageId() },
      }))
    )
      throw new ForbiddenException('You do not have required permissions');
    return (await this.publications.findBySiteId(siteId)).map(
      (publication) => ({
        id: publication.getId(),
        page_id: publication.getPageId(),
        path: publication.getPath(),
        published:
          publication.getUnpublishedAt() === null &&
          site.getDisabledAt() === null,
      }),
    );
  }
}
