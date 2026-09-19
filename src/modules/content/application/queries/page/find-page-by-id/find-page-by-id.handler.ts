import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { FindPageByIdQuery } from './find-page-by-id.query';

@Injectable()
export class FindPageByIdHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: FindPageByIdQuery): Promise<PageResponseDto> {
    const page = await this.pageRepo.findById(query.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    /**
     * Quyền đọc Page.
     *
     * AuthorizationService tự kiểm tra:
     *
     * - Workspace / Teamspace
     * - PageShare
     * - Workspace General Access
     * - Share Link nếu có shareToken
     */
    const canRead = await this.authorizationService.authorize({
      userId: query.userId,

      permissions: [PERMISSIONS.PAGE_READ],

      target: {
        type: 'page',
        id: page.getId(),
      },

      shareToken: query.shareToken,
    });

    if (!canRead) {
      throw new ForbiddenException(
        'You do not have permission to view this page',
      );
    }

    /**
     * Tính quyền edit để FE sử dụng.
     *
     * Share Link EDITOR cũng sẽ được
     * AuthorizationService xử lý ở đây.
     */
    const canEdit = await this.authorizationService.authorize({
      userId: query.userId,

      permissions: [PERMISSIONS.PAGE_UPDATE],

      target: {
        type: 'page',
        id: page.getId(),
      },

      shareToken: query.shareToken,
    });

    return PageResponseDto.fromDomain(page, {
      canEdit,
    });
  }
}
