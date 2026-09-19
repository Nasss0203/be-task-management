import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';

import { PageAccessRequest } from '../../../../domain/entities/page-access-request.entity';

import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';
import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { CreatePageAccessRequestCommand } from './create-page-access-request.command';

export interface CreatePageAccessRequestResult {
  id: string;
  pageId: string;
  userId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class CreatePageAccessRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepository: PageShareLinkRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async execute(
    command: CreatePageAccessRequestCommand,
  ): Promise<CreatePageAccessRequestResult> {
    /**
     * 1. Verify share token.
     */
    const verified = this.pageShareLinkTokenService.verify(command.token);

    if (!verified) {
      throw new ForbiddenException('Invalid share link');
    }

    return this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * 2. Kiểm tra Page tồn tại.
       */
      const page = await this.pageRepository.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /**
       * 3. Kiểm tra PageShareLink.
       */
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

      /**
       * Token của Page A không được dùng để
       * request access Page B.
       */
      if (shareLink.getPageId() !== command.pageId) {
        throw new ForbiddenException('Share link does not belong to this page');
      }

      /**
       * 4. Request Access chỉ tồn tại trong:
       *
       * Only people invited
       * linkAccessLevel = null
       */
      const setting = await this.pageGeneralAccessReader.findByPageId(
        command.pageId,
      );

      const linkAccessLevel = setting?.linkAccessLevel ?? null;

      if (linkAccessLevel !== null) {
        throw new ConflictException(
          'Access request is not required while link access is enabled',
        );
      }

      /**
       * 5. Nếu user đã có quyền đọc Page
       * thì không cần Request Access.
       *
       * Không truyền shareToken vì đang kiểm tra
       * quyền persistent/normal của user.
       */
      const alreadyHasAccess = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_READ],
        target: {
          type: 'page',
          id: command.pageId,
        },
      });

      if (alreadyHasAccess) {
        throw new ConflictException('You already have access to this page');
      }

      /**
       * 6. Không cho tạo nhiều request PENDING.
       */
      const pending =
        await this.pageAccessRequestRepository.findPendingByPageAndUser(
          command.pageId,
          command.userId,
          manager,
        );

      if (pending) {
        throw new ConflictException('Access request is already pending');
      }

      /**
       * 7. Tạo request.
       *
       * KHÔNG tạo PageShare ở đây.
       */
      const request = PageAccessRequest.create({
        pageId: command.pageId,
        userId: command.userId,
      });

      const saved = await this.pageAccessRequestRepository.save(
        request,
        manager,
      );

      return {
        id: saved.getId(),
        pageId: saved.getPageId(),
        userId: saved.getUserId(),
        status: saved.getStatus(),
        createdAt: saved.getCreatedAt(),
      };
    });
  }
}
