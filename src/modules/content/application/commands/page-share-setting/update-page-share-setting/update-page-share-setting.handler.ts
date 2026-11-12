import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

import { PageShareSetting } from 'src/modules/content/domain/entities/page-share-setting.entity';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { PageShareSettingRepository } from 'src/modules/content/domain/repositories/page-share-setting.repository';

import { PageShareSettingDto } from '../../../dto/page-share-setting/page-share-setting.dto';
import { UpdatePageShareSettingCommand } from './update-page-share-setting.command';

@Injectable()
export class UpdatePageShareSettingHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareSettingRepository)
    private readonly pageShareSettingRepository: PageShareSettingRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: UpdatePageShareSettingCommand,
  ): Promise<PageShareSettingDto> {
    const allowed = await this.authorizationService.authorize({
      userId: command.userId,

      permissions: [PERMISSIONS.PAGE_SHARE_UPDATE],

      target: {
        type: 'page',
        id: command.pageId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to update page share settings',
      );
    }

    if (
      command.workspaceAccessLevel &&
      command.workspaceAccessLevel !== ResourceAccessLevel.VIEWER
    ) {
      const page = await this.pageRepository.findById(command.pageId);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      if (page.getTeamspaceId()) {
        throw new BadRequestException(
          'Teamspace pages can only be shared with the workspace as view only',
        );
      }
    }

    let setting = await this.pageShareSettingRepository.findByPageId(
      command.pageId,
    );

    if (!setting) {
      setting = PageShareSetting.create({
        pageId: command.pageId,
      });
    }

    if (command.workspaceAccessLevel !== undefined) {
      setting.setWorkspaceAccessLevel(command.workspaceAccessLevel);
    }

    if (command.linkAccessLevel !== undefined) {
      setting.setLinkAccessLevel(command.linkAccessLevel);
    }

    const saved = await this.pageShareSettingRepository.save(setting);

    return PageShareSettingDto.fromDomain(saved);
  }
}
