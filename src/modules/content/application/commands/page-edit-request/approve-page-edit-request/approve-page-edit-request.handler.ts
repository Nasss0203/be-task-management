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
import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import { ApprovePageEditRequestCommand } from './approve-page-edit-request.command';

// dùng đúng path hiện tại trong project của bạn
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

// dùng đúng path PERSISTENCE_TYPES + UnitOfWork hiện tại
import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageEditRequestDto } from '../../../dto/page-edit-request/page-edit-request.dto';

@Injectable()
export class ApprovePageEditRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageEditRequestRepository)
    private readonly pageEditRequestRepository: PageEditRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    private readonly authorizationService: AuthorizationService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: ApprovePageEditRequestCommand,
  ): Promise<PageEditRequestDto> {
    return this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * 1. Tìm request.
       */
      const editRequest = await this.pageEditRequestRepository.findById(
        command.requestId,
        manager,
      );

      if (!editRequest) {
        throw new NotFoundException('Page edit request not found');
      }

      /**
       * 2. Người approve phải có quyền
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
          'You do not have permission to approve this request',
        );
      }

      /**
       * 3. Chỉ request PENDING mới được approve.
       */
      if (editRequest.getStatus() !== PageEditRequestStatus.PENDING) {
        throw new ConflictException(
          'Page edit request has already been reviewed',
        );
      }

      /**
       * 4. Tìm PageShare của user request.
       */
      const pageShare = await this.pageShareRepository.findById(
        editRequest.getPageShareId(),
        manager,
      );

      if (!pageShare) {
        throw new NotFoundException('Page share not found');
      }

      /**
       * Có thể validate thêm để tránh dữ liệu
       * PageEditRequest/PageShare không khớp.
       */
      if (
        pageShare.getPageId() !== editRequest.getPageId() ||
        pageShare.getUserId() !== editRequest.getUserId()
      ) {
        throw new ConflictException('Page share does not match edit request');
      }

      /**
       * 5. Cấp EDITOR cho toàn Page.
       */
      pageShare.changeAccessLevel(ResourceAccessLevel.EDITOR);

      /**
       * 6. Request → APPROVED.
       */
      editRequest.approve(command.userId);

      /**
       * 7. Save cả hai bằng cùng EntityManager.
       */
      await this.pageShareRepository.save(pageShare, manager);

      const savedRequest = await this.pageEditRequestRepository.save(
        editRequest,
        manager,
      );

      return PageEditRequestDto.fromDomain(savedRequest);
    });
  }
}
