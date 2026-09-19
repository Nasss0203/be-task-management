import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PageShareLinkTokenService } from '../../../../../../shared/security/page-share-link-token.service';

import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';
import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import type { PageShareStatus } from '../../../../domain/constants/page-share-status.constant';
import type { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

import { ResolvePageShareLinkQuery } from './resolve-page-share-link.query';

export interface ResolvePageShareLinkInvitation {
  shareId: string;
  accessLevel: ResourceAccessLevel;
  status: PageShareStatus;
}

export interface ResolvePageShareLinkResult {
  pageId: string;

  /**
   * null:
   * Only people invited
   *
   * VIEWER / EDITOR:
   * Anyone with the link
   */
  linkAccessLevel: ResourceAccessLevel | null;

  /**
   * Chỉ cần thiết cho Only people invited.
   *
   * null:
   * user không được invite.
   */
  invitation: ResolvePageShareLinkInvitation | null;
}

@Injectable()
export class ResolvePageShareLinkHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepo: PageShareLinkRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepo: PageShareRepository,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async execute(
    query: ResolvePageShareLinkQuery,
  ): Promise<ResolvePageShareLinkResult> {
    /**
     * 1. Verify token signature.
     */
    const verified = this.pageShareLinkTokenService.verify(query.token);

    if (!verified) {
      throw new ForbiddenException('Invalid share link');
    }

    /**
     * 2. Tìm stable PageShareLink.
     */
    const shareLink = await this.pageShareLinkRepo.findById(verified.linkId);

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    /**
     * 3. Link đã bị revoke.
     */
    if (shareLink.getRevokedAt()) {
      throw new ForbiddenException('Share link has been revoked');
    }

    /**
     * 4. Link đã hết hạn.
     */
    const expiresAt = shareLink.getExpiresAt();

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Share link has expired');
    }

    const pageId = shareLink.getPageId();

    /**
     * 5. Đọc General Access.
     */
    const setting = await this.pageGeneralAccessReader.findByPageId(pageId);

    const linkAccessLevel = setting?.linkAccessLevel ?? null;

    /**
     * Anyone with the link.
     *
     * Link tự cấp quyền nên không cần
     * kiểm tra invitation.
     */
    if (linkAccessLevel !== null) {
      return {
        pageId,
        linkAccessLevel,
        invitation: null,
      };
    }

    /**
     * Only people invited.
     *
     * Share link không tự cấp quyền.
     * Kiểm tra current user có PageShare
     * invitation hay không.
     */
    const pageShare = await this.pageShareRepo.findByPageAndUser(
      pageId,
      query.userId,
    );

    if (!pageShare) {
      return {
        pageId,
        linkAccessLevel: null,
        invitation: null,
      };
    }

    return {
      pageId,
      linkAccessLevel: null,
      invitation: {
        shareId: pageShare.getId(),
        accessLevel: pageShare.getAccessLevel(),
        status: pageShare.getStatus(),
      },
    };
  }
}
