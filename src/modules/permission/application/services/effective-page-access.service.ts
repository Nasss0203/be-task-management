import { Injectable } from '@nestjs/common';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

import { PageAccessPermissionPolicy } from '../../domain/policies/page-access-permission.policy';

import { AuthorizationService } from './authorization.service';

@Injectable()
export class EffectivePageAccessService {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async resolve(
    userId: string,
    pageId: string,
  ): Promise<ResourceAccessLevel | null> {
    /**
     * Kiểm tra từ level cao nhất xuống thấp nhất.
     */
    const levels: readonly ResourceAccessLevel[] = [
      ResourceAccessLevel.FULL_ACCESS,
      ResourceAccessLevel.EDITOR,
      ResourceAccessLevel.COMMENTER,
      ResourceAccessLevel.VIEWER,
    ];

    for (const level of levels) {
      const permissions = PageAccessPermissionPolicy.getPermissions(level);

      const allowed = await this.authorizationService.authorize({
        userId,
        permissions,
        target: {
          type: 'page',
          id: pageId,
        },
      });

      if (allowed) {
        return level;
      }
    }

    return null;
  }
}
