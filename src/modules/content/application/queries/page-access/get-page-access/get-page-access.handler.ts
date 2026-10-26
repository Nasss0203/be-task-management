import { Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { EffectivePageAccessService } from 'src/modules/permission/application/services/effective-page-access.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { GetPageAccessQuery } from './get-page-access.query';

@Injectable()
export class GetPageAccessHandler {
  constructor(
    private readonly effectivePageAccessService: EffectivePageAccessService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetPageAccessQuery) {
    const [effectiveAccessLevel, canPublish] = await Promise.all([
      this.effectivePageAccessService.resolve(query.userId, query.pageId),
      this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.PAGE_PUBLISH],
        target: { type: 'page', id: query.pageId },
      }),
    ]);

    return {
      effectiveAccessLevel,
      canPublish,
    };
  }
}
