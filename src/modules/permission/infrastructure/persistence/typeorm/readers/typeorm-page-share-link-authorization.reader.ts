import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';

import { PageShareLinkOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-share-link.orm-entity';

import type { PageShareLinkAuthorizationReader } from 'src/modules/permission/application/ports/page-share-link-authorization-reader.port';

import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';

import { PageShareLinkPermissionPolicy } from 'src/modules/permission/domain/policies/page-share-link-permission.policy';

import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

@Injectable()
export class TypeOrmPageShareLinkAuthorizationReader implements PageShareLinkAuthorizationReader {
  constructor(
    @InjectRepository(PageShareLinkOrmEntity)
    private readonly pageShareLinkRepo: Repository<PageShareLinkOrmEntity>,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async authorize(params: {
    token: string;
    pageId: string;
    permissions: readonly import('src/modules/permission/domain/permissions/permission-code').PermissionCode[];
  }): Promise<boolean> {
    const { token, pageId, permissions } = params;

    /**
     * 1. Verify token signature.
     */
    const verified = this.pageShareLinkTokenService.verify(token);

    if (!verified) {
      return false;
    }

    /**
     * 2. Tìm PageShareLink.
     */
    const shareLink = await this.pageShareLinkRepo.findOne({
      where: {
        id: verified.linkId,
      },
    });

    if (!shareLink) {
      return false;
    }

    /**
     * 3. Link đã bị revoke.
     */
    if (shareLink.revoked_at) {
      return false;
    }

    /**
     * 4. Link hết hạn.
     */
    if (shareLink.expires_at && shareLink.expires_at.getTime() <= Date.now()) {
      return false;
    }

    /**
     * 5. Token phải thuộc đúng Page.
     *
     * Đây là check security quan trọng.
     *
     * Token Page A không được dùng
     * để truy cập Page/Block của Page B.
     */
    if (shareLink.page_id !== pageId) {
      return false;
    }

    /**
     * 6. Đọc General Access của Page.
     */
    const setting = await this.pageGeneralAccessReader.findByPageId(
      shareLink.page_id,
    );

    const linkAccessLevel = setting?.linkAccessLevel;

    /**
     * Only people invited.
     *
     * Token vẫn có thể resolve Page,
     * nhưng KHÔNG cấp permission.
     */
    if (!linkAccessLevel) {
      return false;
    }

    /**
     * 7. Check permission từ linkAccessLevel.
     */
    return PageShareLinkPermissionPolicy.hasAllPermissions(
      linkAccessLevel,
      permissions,
    );
  }
}
