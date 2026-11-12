import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { TeamspacePermissionReader } from 'src/modules/permission/application/ports/teamspace-permission-reader.port';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';

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

    @Inject(PERMISSION_TYPES.ports.TeamspacePermissionReader)
    private readonly teamspacePermissionReader: TeamspacePermissionReader,

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

    await this.assertTeamspaceSharing(command);

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

  private async assertTeamspaceSharing(
    command: UpdatePageShareSettingCommand,
  ): Promise<void> {
    const opensToWorkspace = Boolean(command.workspaceAccessLevel);
    const linkBeyondView =
      Boolean(command.linkAccessLevel) &&
      command.linkAccessLevel !== ResourceAccessLevel.VIEWER;

    if (!opensToWorkspace && !linkBeyondView) {
      return;
    }

    const page = await this.pageRepository.findById(command.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const teamspaceId = page.getTeamspaceId();

    if (!teamspaceId) {
      return;
    }

    if (linkBeyondView) {
      throw new BadRequestException(
        'Teamspace pages can only be shared by link as view only',
      );
    }

    if (command.workspaceAccessLevel !== ResourceAccessLevel.VIEWER) {
      throw new BadRequestException(
        'Teamspace pages can only be shared with the workspace as view only',
      );
    }

    const teamspace =
      await this.teamspacePermissionReader.findTeamspace(teamspaceId);

    if (teamspace?.visibility !== TeamspaceVisibility.OPEN) {
      throw new BadRequestException(
        'Pages in a private teamspace cannot be shared with the whole workspace',
      );
    }
  }
}
