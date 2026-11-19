import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationAvailabilityService } from 'src/modules/content/application/services/publication-availability.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import type { AttachmentRepository } from '../../../domain/repositories/attachment.repository';
import type { AttachmentDownloadUrlDto } from '../../dto/attachment-download-url.dto';
import type { AttachmentStoragePort } from '../../ports/attachment-storage.port';
import { createAttachmentDownloadUrl } from '../../services/create-attachment-download-url';
import { CreatePublicSiteAttachmentDownloadUrlQuery } from './create-public-site-attachment-download-url.query';

@Injectable()
export class CreatePublicSiteAttachmentDownloadUrlHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.repository)
    private readonly attachmentRepository: AttachmentRepository,
    @Inject(ATTACHMENT_TOKENS.storage)
    private readonly storage: AttachmentStoragePort,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly blocks: PageBlockRepository,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(
    query: CreatePublicSiteAttachmentDownloadUrlQuery,
  ): Promise<AttachmentDownloadUrlDto> {
    const attachment = await this.findPublishedAttachment(query).catch(
      (error: unknown) => {
        if (error instanceof BadRequestException) return null;
        throw error;
      },
    );

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return createAttachmentDownloadUrl(attachment, this.storage);
  }

  private async findPublishedAttachment(
    query: CreatePublicSiteAttachmentDownloadUrlQuery,
  ): Promise<AttachmentAggregate | null> {
    const site = await this.sites.findActiveBySubdomain(query.subdomain);
    if (!site) return null;

    const publication = await this.publications.findActiveBySiteAndPath(
      site.getId(),
      query.path,
    );
    if (!publication) return null;

    const resolved = await this.availability.resolve(site, publication);
    if (!resolved) return null;

    const attachment = await this.attachmentRepository.findReadyById(
      query.attachmentId,
    );
    const pageBlockId = attachment?.getPageBlockId();
    if (
      !attachment ||
      !pageBlockId ||
      attachment.getWorkspaceId() !== site.getWorkspaceId()
    )
      return null;

    const block = await this.blocks.findById(pageBlockId);
    const content = block?.getContent();
    const isShownOnPage =
      block !== null &&
      block.getDeletedAt() === null &&
      block.getPageId() === resolved.page.getId() &&
      !!content &&
      !Array.isArray(content) &&
      'attachmentId' in content &&
      content.attachmentId === attachment.getId();

    return isShownOnPage ? attachment : null;
  }
}
