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

import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';
import { RejectPageShareLinkCommand } from './reject-page-share-link.command';

export interface RejectPageShareLinkResult {
  pageId: string;
  shareId: string;
}

@Injectable()
export class RejectPageShareLinkHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepository: PageShareLinkRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async execute(
    command: RejectPageShareLinkCommand,
  ): Promise<RejectPageShareLinkResult> {
    const verified = this.pageShareLinkTokenService.verify(command.token);

    if (!verified) {
      throw new NotFoundException('Share link not found');
    }

    return this.unitOfWork.runInTransaction(async (manager) => {
      const shareLink = await this.pageShareLinkRepository.findById(
        verified.linkId,
        manager,
      );

      if (!shareLink) {
        throw new NotFoundException('Share link not found');
      }

      if (shareLink.getRevokedAt()) {
        throw new GoneException('Share link has been revoked');
      }

      const expiresAt = shareLink.getExpiresAt();

      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new GoneException('Share link has expired');
      }

      const pageId = shareLink.getPageId();

      const setting = await this.pageGeneralAccessReader.findByPageId(pageId);

      const linkAccessLevel = setting?.linkAccessLevel ?? null;

      if (linkAccessLevel !== null) {
        throw new ConflictException(
          'Invitation cannot be processed while link access is enabled',
        );
      }

      /**
       * Tìm invitation của chính user
       * đang đăng nhập.
       */
      const pageShare = await this.pageShareRepository.findByPageAndUser(
        pageId,
        command.userId,
        manager,
      );

      if (!pageShare) {
        throw new NotFoundException('Page invitation not found');
      }

      /**
       * Domain:
       *
       * PENDING -> REJECTED
       */
      pageShare.reject();

      const saved = await this.pageShareRepository.save(pageShare, manager);

      return {
        pageId: saved.getPageId(),
        shareId: saved.getId(),
      };
    });
  }
}
