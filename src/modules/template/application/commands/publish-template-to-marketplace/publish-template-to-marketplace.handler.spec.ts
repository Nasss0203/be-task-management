import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PublishTemplateToMarketplaceHandler } from './publish-template-to-marketplace.handler';
import { PublishTemplateToMarketplaceCommand } from './publish-template-to-marketplace.command';
import { PageTemplate } from '../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplateStatus } from '../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../domain/repositories/template-version.repository';
import type { TemplateListingRepository } from '../../../domain/repositories/template-listing.repository';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

describe('PublishTemplateToMarketplaceHandler', () => {
  const context = {};
  let template: PageTemplate;
  let version: TemplateVersion;
  let listing: TemplateListing | null;
  const templates = { findByIdForUpdate: jest.fn(), save: jest.fn() };
  const versions = { findByIdForUpdate: jest.fn(), save: jest.fn() };
  const listings = { findByTemplateId: jest.fn(), save: jest.fn() };
  const auth = { authorize: jest.fn() };
  const uow: UnitOfWork = { runInTransaction: (fn) => fn(context) };
  const handler = new PublishTemplateToMarketplaceHandler(
    templates as unknown as PageTemplateRepository,
    versions as unknown as TemplateVersionRepository,
    listings as unknown as TemplateListingRepository,
    uow,
    auth as unknown as AuthorizationService,
  );
  const command = (user = 'creator', id = 'v1') =>
    new PublishTemplateToMarketplaceCommand(
      't1',
      id,
      user,
      TemplateOfferType.FREE,
    );
  beforeEach(() => {
    jest.resetAllMocks();
    template = PageTemplate.restore({
      id: 't1',
      workspaceId: 'w1',
      sourcePageId: null,
      name: 'Template',
      description: null,
      icon: null,
      coverUrl: null,
      createdBy: 'creator',
      status: TemplateStatus.DRAFT,
      visibility: TemplateVisibility.PRIVATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    version = TemplateVersion.create({
      id: 'v1',
      templateId: 't1',
      versionNumber: 1,
      createdBy: 'creator',
    });
    listing = null;
    templates.findByIdForUpdate.mockImplementation(() =>
      Promise.resolve(template),
    );
    templates.save.mockImplementation((t) => Promise.resolve(t));
    versions.findByIdForUpdate.mockImplementation(() =>
      Promise.resolve(version),
    );
    versions.save.mockImplementation((v) => Promise.resolve(v));
    listings.findByTemplateId.mockImplementation(() =>
      Promise.resolve(listing),
    );
    listings.save.mockImplementation((l) => {
      listing = l as TemplateListing;
      return Promise.resolve(l);
    });
    auth.authorize.mockResolvedValue(false);
  });
  it('publishes only the selected draft, sets PUBLIC, creates and pins FREE without changing template status', async () => {
    const result = await handler.execute(command());
    expect(result.template.status).toBe(TemplateStatus.DRAFT);
    expect(result.template.visibility).toBe(TemplateVisibility.PUBLIC);
    expect(result.version.status).toBe('PUBLISHED');
    expect(result.listing.published_version_id).toBe('v1');
    expect(result.listing.status).toBe('PUBLISHED');
    expect(versions.findByIdForUpdate).toHaveBeenCalledWith('v1', context);
    expect(templates.save).toHaveBeenCalledWith(template, context);
    expect(listings.save).toHaveBeenCalledWith(listing, context);
  });
  it('repeated calls preserve ID and publication timestamps and skip saves', async () => {
    const first = await handler.execute(command());
    const second = await handler.execute(command());
    expect(second.listing).toEqual(first.listing);
    expect(versions.save).toHaveBeenCalledTimes(1);
    expect(templates.save).toHaveBeenCalledTimes(1);
    expect(listings.save).toHaveBeenCalledTimes(1);
  });
  it('reuses an existing draft listing and already published version', async () => {
    version.publish();
    template.updateMetadata({ visibility: TemplateVisibility.PUBLIC });
    listing = TemplateListing.create({
      id: 'existing',
      templateId: 't1',
      createdBy: 'creator',
    });
    expect((await handler.execute(command())).listing.id).toBe('existing');
    expect(versions.save).not.toHaveBeenCalled();
  });
  it('allows workspace managers', async () => {
    auth.authorize.mockResolvedValue(true);
    await expect(handler.execute(command('manager'))).resolves.toBeDefined();
  });
  it('rejects a foreign version before writes', async () => {
    version = TemplateVersion.create({
      id: 'v1',
      templateId: 'other',
      versionNumber: 1,
      createdBy: 'creator',
    });
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(versions.save).not.toHaveBeenCalled();
    expect(templates.save).not.toHaveBeenCalled();
    expect(listings.save).not.toHaveBeenCalled();
  });
  it('rejects unauthorized users before version lookup', async () => {
    await expect(handler.execute(command('other'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(versions.findByIdForUpdate).not.toHaveBeenCalled();
  });
  it('rejects archived templates', async () => {
    template.archive();
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(versions.save).not.toHaveBeenCalled();
  });
  it('rejects missing templates and versions', async () => {
    templates.findByIdForUpdate.mockResolvedValueOnce(null);
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    versions.findByIdForUpdate.mockResolvedValueOnce(null);
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('switches a live listing to an older selected version without publishing others', async () => {
    const newer = TemplateVersion.create({
      id: 'v2',
      templateId: 't1',
      versionNumber: 2,
      createdBy: 'creator',
    });
    newer.publish();
    listing = TemplateListing.create({
      id: 'existing',
      templateId: 't1',
      createdBy: 'creator',
    });
    listing.selectPublishedVersion(newer);
    listing.publish();
    const result = await handler.execute(command());
    expect(result.listing.published_version_id).toBe('v1');
    expect(versions.save).toHaveBeenCalledTimes(1);
  });
  it.each(['version', 'visibility', 'listing'] as const)(
    'propagates %s failure to the transaction boundary',
    async (step) => {
      const error = new Error('injected');
      ({
        version: versions.save,
        visibility: templates.save,
        listing: listings.save,
      })[step].mockRejectedValueOnce(error);
      await expect(handler.execute(command())).rejects.toBe(error);
    },
  );
});
