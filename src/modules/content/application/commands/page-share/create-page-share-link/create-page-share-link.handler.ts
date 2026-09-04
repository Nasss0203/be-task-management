import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

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
  ) {}

  async execute(
    command: CreatePageShareLinkCommand,
  ): Promise<CreatePageShareLinkResult> {
    /**
     * Người tạo link phải có quyền quản lý Share.
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

    /**
     * Raw token chỉ trả về client.
     * Database chỉ lưu SHA-256 hash.
     */
    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256').update(token).digest('hex');

    await this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      const shareLink = PageShareLink.create({
        pageId: command.pageId,

        tokenHash,

        accessLevel: command.accessLevel,

        createdBy: command.userId,

        expiresAt: command.expiresAt ?? null,
      });

      await this.pageShareLinkRepo.save(shareLink, manager);
    });

    return {
      token,
      expiresAt: command.expiresAt ?? null,
    };
  }
}
