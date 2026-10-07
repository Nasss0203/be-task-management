import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { TemplateVersionAssetStatus } from 'src/modules/template/domain/enums/template-version-asset-status.enum';
import { TemplateVersionAssetType } from 'src/modules/template/domain/enums/template-version-asset-type.enum';

import type { PageTemplateRepository } from 'src/modules/template/domain/repositories/page-template.repository';
import type { TemplateVersionAssetRepository } from 'src/modules/template/domain/repositories/template-version-asset.repository';
import type { TemplateVersionRepository } from 'src/modules/template/domain/repositories/template-version.repository';

import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import { GetTemplateVersionThumbnailQuery } from './get-template-version-thumbnail.query';

const THUMBNAIL_SIGNED_URL_EXPIRES_IN_SECONDS = 900;

export type GetTemplateVersionThumbnailResult = {
  url: string;
  mimeType: string;
  width: number;
  height: number;
};

@Injectable()
export class GetTemplateVersionThumbnailHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionAssetRepository)
    private readonly templateVersionAssetRepository: TemplateVersionAssetRepository,

    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly objectStorage: ObjectStoragePort,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetTemplateVersionThumbnailQuery,
  ): Promise<GetTemplateVersionThumbnailResult> {
    /*
     * 1. Load template
     */
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
    );

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    /*
     * 2. Load exact version
     */
    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    if (version.getTemplateId() !== template.getId()) {
      throw new NotFoundException('Template version not found');
    }

    /*
     * 3. Check public accessibility
     *
     * PUBLIC + PUBLISHED:
     * anonymous user cũng xem được thumbnail.
     */
    const visibility = String(template.getVisibility());
    const versionStatus = String(version.getStatus());

    console.log('[thumbnail-public-check]', {
      templateId: query.templateId,
      versionId: query.versionId,
      visibility,
      versionStatus,
      userId: query.userId,
    });

    const isPublicPublished =
      visibility === 'PUBLIC' && versionStatus === 'PUBLISHED';

    /*
     * 4. Nếu không phải PUBLIC + PUBLISHED
     * thì bắt buộc phải có authenticated user.
     */
    if (!isPublicPublished) {
      if (!query.userId) {
        /*
         * Dùng 404 thay vì tiết lộ rằng private/draft
         * template thực sự tồn tại.
         */
        throw new NotFoundException('Template not found');
      }

      await this.authorizePrivateAccess({
        userId: query.userId,
        visibility,
        versionStatus,
        template,
        version,
      });
    }

    /*
     * 5. Load thumbnail asset
     */
    const asset =
      await this.templateVersionAssetRepository.findByVersionAndType(
        query.versionId,
        TemplateVersionAssetType.THUMBNAIL,
      );

    if (!asset) {
      throw new NotFoundException('Template thumbnail not found');
    }

    if (asset.getStatus() !== TemplateVersionAssetStatus.READY) {
      throw new NotFoundException('Template thumbnail not found');
    }

    /*
     * 6. Validate asset metadata
     */
    const mimeType = asset.getMimeType();
    const width = asset.getWidth();
    const height = asset.getHeight();

    if (!mimeType || width === null || height === null) {
      throw new NotFoundException('Template thumbnail not found');
    }

    /*
     * 7. Generate temporary signed S3 URL
     *
     * Bucket vẫn PRIVATE.
     */
    const url = await this.objectStorage.getSignedDownloadUrl(
      asset.getStorageKey(),
      THUMBNAIL_SIGNED_URL_EXPIRES_IN_SECONDS,
    );

    return {
      url,
      mimeType,
      width,
      height,
    };
  }

  private async authorizePrivateAccess(input: {
    userId: string;
    visibility: string;
    versionStatus: string;
    template: {
      getCreatedBy(): string;
      getWorkspaceId(): string;
    };
    version: {
      getCreatedBy(): string;
    };
  }): Promise<void> {
    const { userId, visibility, versionStatus, template, version } = input;

    const isTemplateCreator = template.getCreatedBy() === userId;

    const isVersionCreator = version.getCreatedBy() === userId;

    const workspaceId = template.getWorkspaceId();

    const [canReadWorkspace, canUpdateWorkspace] = await Promise.all([
      this.authorizationService.authorize({
        userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: {
          type: 'workspace',
          id: workspaceId,
        },
      }),

      this.authorizationService.authorize({
        userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: {
          type: 'workspace',
          id: workspaceId,
        },
      }),
    ]);

    const isWorkspaceMember = canReadWorkspace === true;

    const isWorkspaceOwner = canUpdateWorkspace === true;

    /*
     * PRIVATE
     *
     * Creator hoặc workspace owner mới xem được.
     */
    if (visibility === 'PRIVATE' && !isTemplateCreator && !isWorkspaceOwner) {
      throw new ForbiddenException(
        'You do not have permission to access this template',
      );
    }

    /*
     * WORKSPACE
     *
     * Phải là workspace member.
     */
    if (visibility === 'WORKSPACE' && !isWorkspaceMember) {
      throw new ForbiddenException(
        'You do not have permission to access this template',
      );
    }

    /*
     * DRAFT
     *
     * Không public dù template visibility = PUBLIC.
     */
    if (
      versionStatus === 'DRAFT' &&
      !isTemplateCreator &&
      !isVersionCreator &&
      !isWorkspaceOwner
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this template version',
      );
    }
  }
}
