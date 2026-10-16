import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type {
  TemplateDistributionPort,
  TemplateEntitlementPort,
} from 'src/modules/marketplace/application/ports/template-distribution.port';
import { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';
import { TemplateEntitlementSource } from 'src/modules/marketplace/domain/enums/template-entitlement-source.enum';
import type { TemplateMarketplaceReleaseRepository } from 'src/modules/marketplace/domain/repositories/template-marketplace-release.repository';
import { TemplatePreviewMode } from 'src/modules/marketplace/domain/enums/template-preview-mode.enum';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { TemplatePreviewResponseDto } from '../../../dto/template-preview/template-preview.response.dto';
import { TemplatePreviewLoader } from '../../../services/template-preview-loader.service';
import { GetTemplatePreviewQuery } from './get-template-preview.query';

@Injectable()
export class GetTemplatePreviewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository)
    private readonly templateDatabaseSnapshotRepository: PageTemplateDatabaseSnapshotRepository,
    private readonly templatePreviewLoader: TemplatePreviewLoader,
    @Inject(MARKETPLACE_TYPES.ports.Distribution)
    private readonly templateListingRepository: TemplateDistributionPort,
    @Inject(MARKETPLACE_TYPES.ports.Entitlements)
    private readonly templateEntitlementRepository: TemplateEntitlementPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository)
    private readonly releases: TemplateMarketplaceReleaseRepository,
  ) {}

  async execute(
    query: GetTemplatePreviewQuery,
  ): Promise<TemplatePreviewResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
    );
    if (!template) throw new NotFoundException('Page template not found');
    if (!query.userId)
      throw new ForbiddenException('Authentication is required');
    const isCreator = template.getCreatedBy() === query.userId;
    const isMember = await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.WORKSPACE_READ],
      target: { type: 'workspace', id: template.getWorkspaceId() },
    });
    const isManager =
      isMember &&
      (await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      }));
    const canManage = isCreator || isManager;
    const listing = await this.templateListingRepository.findByTemplateId(
      template.getId(),
    );
    const entitlement =
      !canManage && listing
        ? await this.templateEntitlementRepository.findByTemplateAndUser(
            template.getId(),
            query.userId,
          )
        : null;

    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );
    if (!version) throw new NotFoundException('Template version not found');
    if (version.getTemplateId() !== template.getId()) {
      throw new BadRequestException(
        'Template version does not belong to this template',
      );
    }
    if (canManage) {
      return this.fullPreview(template, version);
    }

    if (entitlement) {
      if (
        !version.isPublished() ||
        listing?.getDemoVersionId() === version.getId()
      ) {
        throw new ForbiddenException(
          'This template version is not available to your entitlement',
        );
      }
      const release = await this.releases.findByTemplateAndVersion(
        template.getId(),
        version.getId(),
      );
      if (!release) {
        throw new ForbiddenException(
          'This template version is not available to your entitlement',
        );
      }
      if (
        entitlement.getSource() === TemplateEntitlementSource.FREE_CLAIM &&
        release.getOfferTypeAtRelease() !== TemplateOfferType.FREE
      ) {
        throw new ForbiddenException(
          'Free claim does not grant access to paid releases',
        );
      }
      if (
        entitlement.getSource() !== TemplateEntitlementSource.FREE_CLAIM &&
        entitlement.getSource() !== TemplateEntitlementSource.PAID_PURCHASE
      ) {
        throw new ForbiddenException('Unsupported template entitlement');
      }
      return this.fullPreview(template, version);
    }

    // Workspace members can use internal FREE templates without a claim.
    // Match that Use Template rule while keeping PAID snapshots protected.
    if (
      template.getVisibility() === TemplateVisibility.WORKSPACE &&
      template.getStatus() !== TemplateStatus.ARCHIVED &&
      isMember &&
      (!listing || listing.getOfferType() === TemplateOfferType.FREE)
    ) {
      if (version.isDraft()) {
        throw new ForbiddenException(
          'You do not have permission to preview draft template versions',
        );
      }
      const release = await this.releases.findByTemplateAndVersion(
        template.getId(),
        version.getId(),
      );
      if (release?.getOfferTypeAtRelease() === TemplateOfferType.PAID) {
        throw new ForbiddenException(
          'You must purchase this template to access its full content',
        );
      }
      return this.fullPreview(template, version);
    }

    // Signed-in visitors use the same marketplace policy as anonymous users.
    if (
      template.getVisibility() !== TemplateVisibility.PUBLIC ||
      template.getStatus() === TemplateStatus.ARCHIVED ||
      !listing?.isPublished() ||
      !listing.getPublishedVersionId()
    ) {
      throw new ForbiddenException('Template preview is not available');
    }
    if (version.isDraft()) {
      throw new ForbiddenException(
        'You do not have permission to preview draft template versions',
      );
    }
    if (listing.getPreviewMode() === TemplatePreviewMode.IMAGE) {
      throw new ForbiddenException(
        listing.getOfferType() === TemplateOfferType.PAID
          ? 'You must purchase this template to access its full content'
          : 'Interactive preview is disabled for this template listing',
      );
    }
    if (listing.getOfferType() === TemplateOfferType.FREE) {
      if (query.versionId !== listing.getPublishedVersionId()) {
        throw new NotFoundException('Template version not found');
      }
      return this.fullPreview(template, version);
    }

    const demoId = listing.getDemoVersionId();
    if (!demoId || demoId === listing.getPublishedVersionId()) {
      throw new ForbiddenException(
        'You must purchase this template to access its full content',
      );
    }
    if (
      query.versionId !== listing.getPublishedVersionId() &&
      query.versionId !== demoId
    ) {
      throw new NotFoundException('Template version not found');
    }
    const demoVersion = await this.templateVersionRepository.findById(demoId);
    if (
      !demoVersion ||
      demoVersion.getTemplateId() !== template.getId() ||
      !demoVersion.isPublished()
    ) {
      throw new ForbiddenException(
        'You must purchase this template to access its full content',
      );
    }
    const preview = await this.templatePreviewLoader.loadFrom(
      template,
      demoVersion,
    );
    preview.isDemo = true;
    preview.interactive = true;
    preview.demoConfig = listing.getDemoConfig() ?? null;
    return preview;
  }

  private async fullPreview(
    template: Awaited<ReturnType<PageTemplateRepository['findById']>> & {},
    version: Awaited<ReturnType<TemplateVersionRepository['findById']>> & {},
  ): Promise<TemplatePreviewResponseDto> {
    const preview = await this.templatePreviewLoader.loadFrom(
      template,
      version,
    );
    preview.isDemo = false;
    preview.interactive = true;
    return preview;
  }
}
