import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import { PagePublication } from '../../../../domain/entities/page-publication.entity';
import { PagePublicationPath } from '../../../../domain/value-objects/page-publication-path.vo';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PublishSiteResponseDto } from '../../../dto/page-publication/response/publish-site.response.dto';
import { PublishPageToSiteCommand } from './publish-page-to-site.command';
import { PagePublicationTreeService } from '../../../services/page-publication-tree.service';

@Injectable()
export class PublishPageToSiteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork) private readonly uow: UnitOfWork,
    private readonly authorization: AuthorizationService,
    private readonly publicationTree: PagePublicationTreeService,
  ) {}
  async execute(
    command: PublishPageToSiteCommand,
  ): Promise<PublishSiteResponseDto> {
    try {
      return await this.uow.runInTransaction(async (context) => {
        const candidateSite = await this.sites.findById(
          command.siteId,
          context,
        );
        if (!candidateSite)
          throw new NotFoundException('Published site not found');
        await this.pages.lockWorkspaceHierarchy(
          candidateSite.getWorkspaceId(),
          context,
        );
        const site = await this.sites.findByIdForUpdate(
          command.siteId,
          context,
        );
        if (!site) throw new NotFoundException('Published site not found');
        if (site.getDisabledAt() !== null)
          throw new BadRequestException('Published site is disabled');
        const page = await this.pages.findById(command.pageId, context);
        if (!page || page.getDeletedAt() !== null)
          throw new NotFoundException('Page not found');
        if (site.getWorkspaceId() !== page.getWorkspaceId())
          throw new BadRequestException(
            'Page and site must belong to the same workspace',
          );
        if (!page.getParentPageId())
          throw new ConflictException(
            'Root pages cannot be attached to another public site',
          );
        const parentPublication = await this.publications.findBySiteAndPage(
          site.getId(),
          page.getParentPageId()!,
          context,
        );
        if (
          !parentPublication ||
          parentPublication.getUnpublishedAt() !== null ||
          !parentPublication.inheritsToChildren()
        )
          throw new ConflictException(
            'Page does not inherit from this public site',
          );
        for (const pageId of new Set([page.getId(), site.getRootPageId()])) {
          if (
            !(await this.authorization.authorize({
              userId: command.userId,
              permissions: [PERMISSIONS.PAGE_UPDATE],
              target: { type: 'page', id: pageId },
            }))
          ) {
            throw new ForbiddenException(
              'You do not have required permissions',
            );
          }
        }
        const path = PagePublicationPath.create(command.path).getValue();
        const prefix =
          parentPublication.getPath() === '/'
            ? '/'
            : `${parentPublication.getPath()}/`;
        if (!path.startsWith(prefix) || path.slice(prefix.length).includes('/'))
          throw new ConflictException(
            'Publication path must be a direct child of the parent publication',
          );
        if (path === '/')
          throw new BadRequestException(
            'Root path is reserved for the root publication',
          );
        if (
          await this.publications.findBySiteAndPage(
            site.getId(),
            page.getId(),
            context,
          )
        )
          throw new ConflictException(
            'Page already has a publication in this site; use republish for an unpublished record',
          );
        if (
          await this.publications.findBySiteAndPath(site.getId(), path, context)
        )
          throw new ConflictException('Publication path is already in use');
        const publication = PagePublication.create({
          siteId: site.getId(),
          pageId: page.getId(),
          path,
          parentPublicationId: parentPublication.getId(),
          includeDescendants: command.includeDescendants,
          publishedBy: command.userId,
        });
        const plan = await this.publicationTree.buildPlan(
          site,
          publication,
          command.userId,
          context,
        );
        await this.publicationTree.executePlan(plan, context);
        return PublishSiteResponseDto.fromDomain(site, publication);
      });
    } catch (error) {
      const constraintError = error as {
        driverError?: { code?: string; constraint?: string };
      };
      if (
        constraintError.driverError?.code === '23505' &&
        [
          'UQ_page_publications_site_page',
          'UQ_page_publications_site_path',
        ].includes(constraintError.driverError.constraint ?? '')
      ) {
        throw new ConflictException(
          'Page or path already has a publication in this site',
        );
      }
      throw error;
    }
  }
}
