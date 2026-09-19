import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash, randomUUID } from 'crypto';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageShareLink } from '../../../../domain/entities/page-share-link.entity';

import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';

import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { CreatePageShareLinkCommand } from './create-page-share-link.command';

export interface CreatePageShareLinkResult {
  token: string;

  expiresAt: Date | null;
}

@Injectable()
export class CreatePageShareLinkHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepo: PageShareLinkRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async execute(
    command: CreatePageShareLinkCommand,
  ): Promise<CreatePageShareLinkResult> {
    /**
     * User phải có quyền tạo / quản lý share.
     */
    const allowed = await this.authorizationService.authorize({
      userId: command.userId,

      permissions: [PERMISSIONS.PAGE_SHARE_ADD],

      target: {
        type: 'page',
        id: command.pageId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to create a share link for this page',
      );
    }

    return this.uow.runInTransaction(async (manager) => {
      /**
       * Đảm bảo Page tồn tại.
       */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /**
       * Tìm link đang active của Page.
       */
      const existingLink = await this.pageShareLinkRepo.findActiveByPageId(
        command.pageId,
        manager,
      );

      if (existingLink) {
        /**
         * Token được sinh ổn định từ linkId.
         *
         * Cùng linkId + cùng secret
         * => luôn ra cùng token.
         */
        const token = this.pageShareLinkTokenService.generate(
          existingLink.getId(),
        );

        /**
         * Kiểm tra link hiện tại có phải
         * format deterministic mới hay không.
         *
         * Link cũ trước đây được tạo bằng randomBytes()
         * sẽ có tokenHash khác.
         */
        const generatedTokenHash = createHash('sha256')
          .update(token)
          .digest('hex');

        if (generatedTokenHash === existingLink.getTokenHash()) {
          return {
            token,

            expiresAt: existingLink.getExpiresAt(),
          };
        }

        /**
         * Nếu hash không khớp thì đây là legacy link.
         *
         * Không thể tái tạo raw token cũ từ SHA-256 hash.
         * Vì vậy bên dưới sẽ tạo một deterministic link mới.
         */
      }

      /**
       * Sinh ID trước.
       *
       * Token phụ thuộc vào PageShareLink.id,
       * nên phải có linkId trước khi tạo entity.
       */
      const linkId = randomUUID();

      const token = this.pageShareLinkTokenService.generate(linkId);

      /**
       * Vẫn lưu tokenHash để tương thích
       * với schema hiện tại.
       */
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const shareLink = PageShareLink.create({
        id: linkId,

        pageId: command.pageId,

        tokenHash,

        createdBy: command.userId,

        expiresAt: command.expiresAt ?? null,
      });

      await this.pageShareLinkRepo.save(shareLink, manager);

      return {
        token,

        expiresAt: shareLink.getExpiresAt(),
      };
    });
  }
}
