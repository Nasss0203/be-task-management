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

import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';

import { RejectPageAccessRequestCommand } from './reject-page-access-request.command';

export interface RejectPageAccessRequestResult {
  requestId: string;
  pageId: string;
  userId: string;
  status: PageAccessRequestStatus;
}

@Injectable()
export class RejectPageAccessRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: RejectPageAccessRequestCommand,
  ): Promise<RejectPageAccessRequestResult> {
    return this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * 1. Tìm request.
       */
      const request = await this.pageAccessRequestRepository.findById(
        command.requestId,
        manager,
      );

      if (!request) {
        throw new NotFoundException('Page access request not found');
      }

      /**
       * 2. Chỉ PENDING mới được reject.
       */
      if (request.getStatus() !== PageAccessRequestStatus.PENDING) {
        throw new ConflictException(
          'Page access request has already been reviewed',
        );
      }

      /**
       * 3. Reviewer phải có quyền quản lý access.
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
          'You do not have permission to reject this access request',
        );
      }

      /**
       * 4. PENDING -> REJECTED.
       *
       * Không tạo PageShare.
       */
      request.reject(command.reviewerId);

      const saved = await this.pageAccessRequestRepository.save(
        request,
        manager,
      );

      return {
        requestId: saved.getId(),
        pageId: saved.getPageId(),
        userId: saved.getUserId(),
        status: saved.getStatus(),
      };
    });
  }
}
