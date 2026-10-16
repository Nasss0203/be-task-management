import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  TemplateDistributionPort,
  TemplateEntitlementPort,
} from 'src/modules/marketplace/application/ports/template-distribution.port';
import { TemplateEntitlementSource } from 'src/modules/marketplace/domain/enums/template-entitlement-source.enum';
import { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';
import type { TemplateMarketplaceReleaseRepository } from 'src/modules/marketplace/domain/repositories/template-marketplace-release.repository';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import type { GetUsableTemplateVersionsResponseDto } from '../../../dto/template-version/get-usable-template-versions.response.dto';
import { GetUsableTemplateVersionsQuery } from './get-usable-template-versions.query';

@Injectable()
export class GetUsableTemplateVersionsHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly templates: PageTemplateRepository,
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly versions: TemplateVersionRepository,
    @Inject(MARKETPLACE_TYPES.ports.Distribution)
    private readonly listings: TemplateDistributionPort,
    @Inject(MARKETPLACE_TYPES.ports.Entitlements)
    private readonly entitlements: TemplateEntitlementPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository)
    private readonly releases: TemplateMarketplaceReleaseRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetUsableTemplateVersionsQuery,
  ): Promise<GetUsableTemplateVersionsResponseDto> {
    const template = await this.templates.findById(query.templateId);
    if (!template) throw new NotFoundException('Page template not found');

    const canManage =
      template.getCreatedBy() === query.userId ||
      (await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      }));
    const entitlement = canManage
      ? null
      : await this.entitlements.findByTemplateAndUser(
          query.templateId,
          query.userId,
        );
    if (!canManage && !entitlement) {
      throw new ForbiddenException(
        'You do not have permission to use this template',
      );
    }
    const source = entitlement?.getSource();
    if (
      !canManage &&
      source !== TemplateEntitlementSource.PAID_PURCHASE &&
      source !== TemplateEntitlementSource.FREE_CLAIM
    ) {
      throw new ForbiddenException('Unsupported template entitlement');
    }

    const [listing, releases, versions] = await Promise.all([
      this.listings.findByTemplateId(query.templateId),
      this.releases.findByTemplateId(query.templateId),
      this.versions.findByTemplateId(query.templateId),
    ]);
    const versionsById = new Map(
      versions.map((version) => [version.getId(), version]),
    );
    return {
      items: releases.flatMap((release) => {
        const version = versionsById.get(release.getVersionId());
        if (
          release.getTemplateId() !== query.templateId ||
          !version ||
          version.getTemplateId() !== query.templateId ||
          !version.isPublished() ||
          listing?.getDemoVersionId() === version.getId() ||
          (source === TemplateEntitlementSource.FREE_CLAIM &&
            release.getOfferTypeAtRelease() !== TemplateOfferType.FREE)
        ) {
          return [];
        }
        return [
          {
            id: version.getId(),
            version_number: version.getVersionNumber(),
            status: version.getStatus(),
            released_at: release.getReleasedAt(),
            is_current: listing?.getPublishedVersionId() === version.getId(),
          },
        ];
      }),
    };
  }
}
