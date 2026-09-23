import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';

import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';
import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';
import { AcceptPageShareLinkCommand } from './accept-page-share-link.command';

export interface AcceptPageShareLinkResult {
  pageId: string;
  shareId: string;
}

@Injectable()
export class AcceptPageShareLinkHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepository: PageShareLinkRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async execute(
    command: AcceptPageShareLinkCommand,
  ): Promise<AcceptPageShareLinkResult> {
    /**
     * Verify token.
     *
     * Token hiện tại là token signed được sinh từ
     * PageShareLinkTokenService, không hash raw token
     * bằng SHA256 như flow legacy nữa.
     */
    const verified = this.pageShareLinkTokenService.verify(command.token);

    if (!verified) {
      throw new NotFoundException('Share link not found');
    }

    return this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * Lấy PageShareLink từ linkId đã verify.
       */
      const shareLink = await this.pageShareLinkRepository.findById(
        verified.linkId,
        manager,
      );

      if (!shareLink) {
        throw new NotFoundException('Share link not found');
      }

      /**
       * Link đã bị revoke.
       */
      if (shareLink.getRevokedAt()) {
        throw new GoneException('Share link has been revoked');
      }

      /**
       * Link đã hết hạn.
       */
      const expiresAt = shareLink.getExpiresAt();

      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new GoneException('Share link has expired');
      }

      const pageId = shareLink.getPageId();

      const page = await this.pageRepository.findById(pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      const setting = await this.pageGeneralAccessReader.findByPageId(pageId);

      const linkAccessLevel = setting?.linkAccessLevel ?? null;

      if (linkAccessLevel !== null) {
        throw new ConflictException(
          'Invitation cannot be processed while link access is enabled',
        );
      }

      /**
       * Tìm invitation của chính user đang đăng nhập.
       *
       * Ví dụ:
       *
       * Page A
       * User B
       * EDITOR
       * PENDING
       */
      const pageShare = await this.pageShareRepository.findByPageAndUser(
        pageId,
        command.userId,
        manager,
      );

      if (!pageShare) {
        throw new NotFoundException('Page invitation not found');
      }

      const existingMembership =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          page.getWorkspaceId(),
          command.userId,
          manager,
        );

      if (!existingMembership) {
        await this.workspaceMemberRepository.save(
          WorkspaceMember.createGuest({
            workspaceId: page.getWorkspaceId(),
            userId: command.userId,
          }),
          manager,
        );
      }

      /**
       * Domain tự đảm bảo:
       *
       * PENDING  -> ACCEPTED
       *
       * ACCEPTED -> ConflictException
       * REJECTED -> ConflictException
       */
      pageShare.accept();

      const saved = await this.pageShareRepository.save(pageShare, manager);

      return {
        pageId: saved.getPageId(),
        shareId: saved.getId(),
      };
    });
  }
}
