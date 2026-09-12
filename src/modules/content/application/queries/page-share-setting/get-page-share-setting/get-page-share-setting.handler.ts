import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from '../../../../content.types';

import type { PageShareSettingRepository } from '../../../../domain/repositories/page-share-setting.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { PageShareSettingDto } from '../../../dto/page-share-setting/page-share-setting.dto';
import { GetPageShareSettingQuery } from './get-page-share-setting.query';

@Injectable()
export class GetPageShareSettingHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareSettingRepository)
    private readonly pageShareSettingRepository: PageShareSettingRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetPageShareSettingQuery): Promise<PageShareSettingDto> {
    const allowed = await this.authorizationService.authorize({
      userId: query.userId,

      permissions: [PERMISSIONS.PAGE_SHARE_READ],

      target: {
        type: 'page',
        id: query.pageId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to view page share settings',
      );
    }

    const setting = await this.pageShareSettingRepository.findByPageId(
      query.pageId,
    );

    if (!setting) {
      return PageShareSettingDto.restricted();
    }

    return PageShareSettingDto.fromDomain(setting);
  }
}
