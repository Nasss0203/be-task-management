import {
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageShare } from '../../../../domain/entities/page-share.entity';

import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';
import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { AcceptPageShareLinkCommand } from './accept-page-share-link.command';

export interface AcceptPageShareLinkResult {
  pageId: string;
}

@Injectable()
export class AcceptPageShareLinkHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepository: PageShareLinkRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: AcceptPageShareLinkCommand,
  ): Promise<AcceptPageShareLinkResult> {
    const tokenHash = createHash('sha256').update(command.token).digest('hex');

    return this.unitOfWork.runInTransaction(async (manager) => {
      const shareLink = await this.pageShareLinkRepository.findByTokenHash(
        tokenHash,
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

      /**
       * Người tạo link mở chính link của mình.
       *
       * Không cần tạo PageShare cho owner.
       */
      if (command.userId === shareLink.getCreatedBy()) {
        return {
          pageId,
        };
      }

      /**
       * Kiểm tra user này đã được share page chưa.
       */
      const existingShare = await this.pageShareRepository.findByPageAndUser(
        pageId,
        command.userId,
        manager,
      );

      /**
       * Chưa có quyền thì tạo PageShare.
       */
      if (!existingShare) {
        const pageShare = PageShare.create({
          pageId,
          userId: command.userId,
          shareLinkId: shareLink.getId(),
          accessLevel: ResourceAccessLevel.VIEWER,
          createdBy: shareLink.getCreatedBy(),
        });

        await this.pageShareRepository.save(pageShare, manager);
      }

      return {
        pageId,
      };
    });
  }
}
