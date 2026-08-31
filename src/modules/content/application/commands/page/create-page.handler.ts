import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { AuthorizationTarget } from 'src/modules/permission/application/types/authorization-target';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { generateSlug } from 'src/utils';

export class CreatePageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly title: string,
    public readonly teamspaceId?: string | null,
    public readonly icon?: string | null,
    public readonly coverUrl?: string | null,
  ) {}
}

@Injectable()
export class CreatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: CreatePageCommand): Promise<PageResponseDto> {
    const target: AuthorizationTarget = command.teamspaceId
      ? {
          type: 'teamspace',
          id: command.teamspaceId,
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

    const baseSlug = generateSlug(command.title).toLowerCase();

    let slug = baseSlug;

    if (await this.pageRepo.existsBySlug(command.workspaceId, slug)) {
      const uniqueSuffix = Date.now().toString(36);

      slug = `${baseSlug}-${uniqueSuffix}`;
    }

    const page = Page.create({
      workspaceId: command.workspaceId,
      teamspaceId: command.teamspaceId ?? null,
      title: command.title,
      createdBy: command.userId,
      slug,
      icon: command.icon ?? null,
      coverUrl: command.coverUrl ?? null,
      isTemplate: false,
    });

    const savedPage = await this.pageRepo.save(page);

    return PageResponseDto.fromDomain(savedPage);
  }
}
