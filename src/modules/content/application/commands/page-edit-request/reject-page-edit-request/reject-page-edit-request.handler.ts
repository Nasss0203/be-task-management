import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from '../../../../content.types';
import { PageEditRequestStatus } from '../../../../domain/constants/page-edit-request-status.constant';
import type { PageEditRequestRepository } from '../../../../domain/repositories/page-edit-request.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageEditRequestDto } from '../../../dto/page-edit-request/page-edit-request.dto';
import { RejectPageEditRequestCommand } from './reject-page-edit-request.command';

@Injectable()
export class RejectPageEditRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageEditRequestRepository)
    private readonly pageEditRequestRepository: PageEditRequestRepository,

    private readonly authorizationService: AuthorizationService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: RejectPageEditRequestCommand,
  ): Promise<PageEditRequestDto> {
    return this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * 1. Tìm edit request.
       */
      const editRequest = await this.pageEditRequestRepository.findById(
        command.requestId,
        manager,
      );

      if (!editRequest) {
        throw new NotFoundException('Page edit request not found');
      }

      /**
       * 2. Người reject phải có quyền
       * quản lý Page Share.
       */
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,

        permissions: [PERMISSIONS.PAGE_SHARE_UPDATE],

        target: {
          type: 'page',
          id: editRequest.getPageId(),
        },
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to reject this request',
        );
      }

      /**
       * 3. Chỉ request PENDING mới được reject.
       */
      if (editRequest.getStatus() !== PageEditRequestStatus.PENDING) {
        throw new ConflictException(
          'Page edit request has already been reviewed',
        );
      }

      /**
       * 4. PENDING → REJECTED.
       *
       * Không thay đổi PageShare.
       */
      editRequest.reject(command.userId);

      /**
       * 5. Save request.
       */
      const savedRequest = await this.pageEditRequestRepository.save(
        editRequest,
        manager,
      );

      return PageEditRequestDto.fromDomain(savedRequest);
    });
  }
}
