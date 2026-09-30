import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { AuthorizationTarget } from 'src/modules/permission/application/types/authorization-target';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { generateSlug } from 'src/utils';
import { PagePublicationTreeService } from '../../../services/page-publication-tree.service';
import { CreatePageCommand } from './create-page.command';

@Injectable()
export class CreatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    private readonly authorizationService: AuthorizationService,
    @Inject(PERSISTENCE_TYPES.UnitOfWork) private readonly uow: UnitOfWork,
    private readonly publicationTree: PagePublicationTreeService,
  ) {}

  async execute(
    command: CreatePageCommand,
    context?: PersistenceContext,
  ): Promise<PageResponseDto> {
    const create = async (context: PersistenceContext) => {
      await this.pageRepo.lockWorkspaceHierarchy(command.workspaceId, context);
      /**
       * Resolve the scope that the new page belongs to.
       * Root pages use the requested teamspace; child pages inherit it.
       */
      let effectiveTeamspaceId = command.teamspaceId ?? null;

      if (command.parentPageId) {
        const parentPage = await this.pageRepo.findById(
          command.parentPageId,
          context,
        );

        if (!parentPage || parentPage.getDeletedAt() !== null) {
          throw new NotFoundException('Parent page not found');
        }

        /** A child page cannot belong to a different workspace. */
        if (parentPage.getWorkspaceId() !== command.workspaceId) {
          throw new BadRequestException(
            'Parent page does not belong to workspace',
          );
        }

        const parentTeamspaceId = parentPage.getTeamspaceId();

        /** A requested teamspace must match the parent page scope. */
        if (
          command.teamspaceId !== undefined &&
          command.teamspaceId !== null &&
          command.teamspaceId !== parentTeamspaceId
        ) {
          throw new BadRequestException(
            'Child page must belong to the same teamspace as parent page',
          );
        }

        /** Child pages always inherit their parent's teamspace. */
        effectiveTeamspaceId = parentTeamspaceId;
      }

      /** Authorize against the resolved page scope. */
      const target: AuthorizationTarget = effectiveTeamspaceId
        ? {
            type: 'teamspace',
            id: effectiveTeamspaceId,
            workspaceId: command.workspaceId,
          }
        : {
            type: 'workspace',
            id: command.workspaceId,
          };

      const allowed = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_CREATE],
        target,
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to create page in this scope',
        );
      }

      /** Generate slug. */
      const baseSlug =
        generateSlug(command.title).toLowerCase().slice(0, 249) || 'page';

      let slug = baseSlug;

      let suffix = 2;
      while (
        await this.pageRepo.existsBySlug(command.workspaceId, slug, context)
      ) {
        if (suffix > 10000)
          throw new BadRequestException('Page slug allocation limit exceeded');
        slug = `${baseSlug.slice(0, 249)}-${suffix++}`;
      }

      /** Create Page aggregate. */
      const page = Page.create({
        workspaceId: command.workspaceId,

        teamspaceId: effectiveTeamspaceId,

        parentPageId: command.parentPageId ?? null,

        title: command.title,
        createdBy: command.userId,
        slug,

        icon: command.icon ?? null,
        coverUrl: command.coverUrl ?? null,

        isTemplate: false,
      });

      const savedPage = await this.pageRepo.save(page, context);
      await this.publicationTree.inheritNewPage(
        savedPage,
        command.userId,
        context,
      );

      return PageResponseDto.fromDomain(savedPage);
    };

    // A supplied context belongs to an outer transaction; otherwise own the transaction.
    return context === undefined
      ? this.uow.runInTransaction(create)
      : create(context);
  }
}
