import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { CONTENT_TYPES } from '../../../../content.types';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';
import { isAccessLevelAtLeast } from '../../../../domain/constants/resource-access-level.util';

import { PageEditRequest } from '../../../../domain/entities/page-edit-request.entity';

import type { PageEditRequestRepository } from '../../../../domain/repositories/page-edit-request.repository';

import { PageEditRequestDto } from '../../../dto/page-edit-request/page-edit-request.dto';

import type { PageSharePermissionReader } from 'src/modules/permission/application/ports/page-share-permission-reader.port';

import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

import { CreatePageEditRequestCommand } from './create-page-edit-request.command';

@Injectable()
export class CreatePageEditRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageEditRequestRepository)
    private readonly pageEditRequestRepository: PageEditRequestRepository,

    @Inject(PERMISSION_TYPES.ports.PageSharePermissionReader)
    private readonly pageSharePermissionReader: PageSharePermissionReader,
  ) {}

  async execute(
    command: CreatePageEditRequestCommand,
  ): Promise<PageEditRequestDto> {
    const effectiveShare =
      await this.pageSharePermissionReader.findEffectiveShare(
        command.pageId,
        command.userId,
      );

    if (!effectiveShare) {
      throw new ForbiddenException(
        'You do not have shared access to this page',
      );
    }

    /**
     * EDITOR hoặc FULL_ACCESS
     * đã có quyền edit trở lên
     * nên không cần tạo edit request.
     */
    if (
      isAccessLevelAtLeast(
        effectiveShare.accessLevel,
        ResourceAccessLevel.EDITOR,
      )
    ) {
      throw new ConflictException('You already have edit access to this page');
    }

    /**
     * Tới đây chỉ còn:
     *
     * - VIEWER
     * - COMMENTER
     *
     * Hai level này đều có thể request EDITOR.
     */

    const existingPending =
      await this.pageEditRequestRepository.findPendingByPageShareId(
        effectiveShare.shareId,
      );

    if (existingPending) {
      return PageEditRequestDto.fromDomain(existingPending);
    }

    const editRequest = PageEditRequest.create({
      pageId: effectiveShare.sharedPageId,

      pageShareId: effectiveShare.shareId,

      userId: command.userId,
    });

    const saved = await this.pageEditRequestRepository.save(editRequest);

    return PageEditRequestDto.fromDomain(saved);
  }
}
