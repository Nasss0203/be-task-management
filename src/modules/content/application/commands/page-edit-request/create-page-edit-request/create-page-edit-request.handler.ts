import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { CONTENT_TYPES } from '../../../../content.types';

import { PageEditRequest } from '../../../../domain/entities/page-edit-request.entity';

import type { PageEditRequestRepository } from '../../../../domain/repositories/page-edit-request.repository';
import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { PageEditRequestDto } from '../../../dto/page-edit-request/page-edit-request.dto';
import { CreatePageEditRequestCommand } from './create-page-edit-request.command';

@Injectable()
export class CreatePageEditRequestHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageEditRequestRepository)
    private readonly pageEditRequestRepository: PageEditRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,
  ) {}

  async execute(
    command: CreatePageEditRequestCommand,
  ): Promise<PageEditRequestDto> {
    /**
     * User phải thực sự có PageShare.
     *
     * Workspace/Teamspace owner không cần request edit,
     * vì họ đã có quyền thông qua membership.
     */
    const pageShare = await this.pageShareRepository.findByPageAndUser(
      command.pageId,
      command.userId,
    );

    if (!pageShare) {
      throw new ForbiddenException(
        'You do not have shared access to this page',
      );
    }

    /**
     * User đã là EDITOR thì không cần request nữa.
     */
    if (pageShare.getAccessLevel() === ResourceAccessLevel.EDITOR) {
      throw new ConflictException('You already have edit access to this page');
    }

    /**
     * Chỉ VIEWER mới được request edit.
     */
    if (pageShare.getAccessLevel() !== ResourceAccessLevel.VIEWER) {
      throw new ForbiddenException(
        'You cannot request edit access to this page',
      );
    }

    /**
     * Không tạo nhiều PENDING request.
     */
    const existingPending =
      await this.pageEditRequestRepository.findPendingByPageShareId(
        pageShare.getId(),
      );

    if (existingPending) {
      return PageEditRequestDto.fromDomain(existingPending);
    }

    const editRequest = PageEditRequest.create({
      pageId: command.pageId,

      pageShareId: pageShare.getId(),

      userId: command.userId,
    });

    const saved = await this.pageEditRequestRepository.save(editRequest);

    return PageEditRequestDto.fromDomain(saved);
  }
}
