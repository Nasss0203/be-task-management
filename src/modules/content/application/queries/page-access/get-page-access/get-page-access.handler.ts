import { Injectable } from '@nestjs/common';

import { EffectivePageAccessService } from 'src/modules/permission/application/services/effective-page-access.service';

import { GetPageAccessQuery } from './get-page-access.query';

@Injectable()
export class GetPageAccessHandler {
  constructor(
    private readonly effectivePageAccessService: EffectivePageAccessService,
  ) {}

  async execute(query: GetPageAccessQuery) {
    const effectiveAccessLevel = await this.effectivePageAccessService.resolve(
      query.userId,
      query.pageId,
    );

    return {
      effectiveAccessLevel,
    };
  }
}
