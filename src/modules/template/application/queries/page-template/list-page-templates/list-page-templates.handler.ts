import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import type { ListPageTemplatesResponseDto } from '../../../dto/page-template/list-page-templates.response.dto';
import { ListPageTemplatesQuery } from './list-page-templates.query';
import {
  decodeTemplateListCursor,
  encodeTemplateListCursor,
} from './template-list-cursor.helper';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ListPageTemplatesHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListPageTemplatesQuery,
  ): Promise<ListPageTemplatesResponseDto> {
    if (!Object.values(TemplateListScope).includes(query.scope)) {
      throw new BadRequestException('Invalid template list scope');
    }

    if (query.limit !== undefined && (query.limit < 1 || query.limit > 100)) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    let canManageWorkspace = false;

    if (query.scope === TemplateListScope.WORKSPACE) {
      if (!query.workspaceId || !query.workspaceId.trim()) {
        throw new BadRequestException(
          'workspaceId is required for workspace scope',
        );
      }

      if (!UUID_REGEX.test(query.workspaceId.trim())) {
        throw new BadRequestException('workspaceId must be a valid UUID');
      }

      const hasReadPermission = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: {
          type: 'workspace',
          id: query.workspaceId,
        },
      });

      if (!hasReadPermission) {
        throw new ForbiddenException(
          'You do not have permission to access templates in this workspace',
        );
      }

      canManageWorkspace = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: {
          type: 'workspace',
          id: query.workspaceId,
        },
      });
    }

    const trimmedSearch = query.search?.trim();
    const search =
      trimmedSearch && trimmedSearch.length > 0 ? trimmedSearch : undefined;

    const cursor = query.cursor
      ? decodeTemplateListCursor(query.cursor)
      : undefined;

    const limit =
      query.limit && !Number.isNaN(query.limit)
        ? Math.min(Math.max(query.limit, 1), 100)
        : 20;

    const result = await this.pageTemplateRepository.findMany({
      scope: query.scope,
      userId: query.userId,
      workspaceId: query.workspaceId,
      canManageWorkspace,
      search,
      cursor,
      limit,
    });

    const items = result.items.map((template) =>
      PageTemplateResponseDto.fromDomain(template),
    );

    const nextCursor =
      result.hasNextPage && result.items.length > 0
        ? encodeTemplateListCursor({
            createdAt: result.items[result.items.length - 1].getCreatedAt(),
            id: result.items[result.items.length - 1].getId(),
          })
        : null;

    return {
      items,
      nextCursor,
    };
  }
}
