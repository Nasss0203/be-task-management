import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageAccessRequestStatus } from '../../../../domain/constants/page-access-request-status.constant';
import { PageShareStatus } from '../../../../domain/constants/page-share-status.constant';

import { PageShare } from '../../../../domain/entities/page-share.entity';

import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';
import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import { ApprovePageAccessRequestCommand } from './approve-page-access-request.command';

export interface ApprovePageAccessRequestResult {
  requestId: string;
  pageId: string;
  userId: string;
  status: PageAccessRequestStatus;
  accessLevel: string;
}

@Injectable()
export class ApprovePageAccessRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: ApprovePageAccessRequestCommand,
  ): Promise<ApprovePageAccessRequestResult> {
    return this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * 1. Tìm access request.
       */
      const request = await this.pageAccessRequestRepository.findById(
        command.requestId,
        manager,
      );

      if (!request) {
        throw new NotFoundException('Page access request not found');
      }

      /**
       * 2. Chỉ PENDING mới được xử lý.
       */
      if (request.getStatus() !== PageAccessRequestStatus.PENDING) {
        throw new ConflictException(
          'Page access request has already been reviewed',
        );
      }

      /**
       * 3. Reviewer phải có quyền quản lý PageShare.
       */
      const allowed = await this.authorizationService.authorize({
        userId: command.reviewerId,
        permissions: [PERMISSIONS.PAGE_SHARE_UPDATE],
        target: {
          type: 'page',
          id: request.getPageId(),
        },
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to approve this access request',
        );
      }

      /**
       * 4. User không được có PageShare thật từ trước.
       */
      const existingShare = await this.pageShareRepository.findByPageAndUser(
        request.getPageId(),
        request.getUserId(),
        manager,
      );

      if (existingShare) {
        throw new ConflictException('User already has a page share');
      }

      /**
       * 5. Owner approve request.
       */
      request.approve(command.reviewerId);

      /**
       * 6. Tạo quyền thật cho user.
       *
       * User không cần Accept lần nữa.
       */
      const pageShare = PageShare.create({
        pageId: request.getPageId(),
        userId: request.getUserId(),
        accessLevel: command.accessLevel,
        status: PageShareStatus.ACCEPTED,
        createdBy: command.reviewerId,
      });

      const savedShare = await this.pageShareRepository.save(
        pageShare,
        manager,
      );

      const savedRequest = await this.pageAccessRequestRepository.save(
        request,
        manager,
      );

      return {
        requestId: savedRequest.getId(),
        pageId: savedRequest.getPageId(),
        userId: savedRequest.getUserId(),
        status: savedRequest.getStatus(),
        accessLevel: savedShare.getAccessLevel(),
      };
    });
  }
}
