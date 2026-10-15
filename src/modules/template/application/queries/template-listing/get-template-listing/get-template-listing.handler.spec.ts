import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetTemplateListingHandler } from '../../../../../marketplace/application/queries/template-listing/get-template-listing/get-template-listing.handler';
import { GetTemplateListingQuery } from '../../../../../marketplace/application/queries/template-listing/get-template-listing/get-template-listing.query';
import { CreateTemplateListingHandler } from '../../../../../marketplace/application/commands/template-listing/create-template-listing/create-template-listing.handler';
import { CreateTemplateListingCommand } from '../../../../../marketplace/application/commands/template-listing/create-template-listing/create-template-listing.command';
import { PublishTemplateListingHandler } from '../../../../../marketplace/application/commands/template-listing/publish-template-listing/publish-template-listing.handler';
import { PublishTemplateListingCommand } from '../../../../../marketplace/application/commands/template-listing/publish-template-listing/publish-template-listing.command';
import { UnpublishTemplateListingHandler } from '../../../../../marketplace/application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.handler';
import { UnpublishTemplateListingCommand } from '../../../../../marketplace/application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.command';
import { TemplateListing } from '../../../../../marketplace/domain/aggregates/template-listing/template-listing.aggregate';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateListingRepository } from '../../../../../marketplace/domain/repositories/template-listing.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

describe('Listing management category responses', () => {
  const context = {};
  const templates = { findById: jest.fn(), findByIdForUpdate: jest.fn() };
  const listings = {
    findByTemplateId: jest.fn(),
    findCategoriesByTemplateIds: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const authorization = { authorize: jest.fn() };
  const versions = { findById: jest.fn() };
  const templatePort = templates as unknown as PageTemplateRepository;
  const listingPort = listings as unknown as TemplateListingRepository;
  const auth = authorization as unknown as AuthorizationService;
  const uow: UnitOfWork = { runInTransaction: (fn) => fn(context) };
  const handler = new GetTemplateListingHandler(
    templatePort,
    listingPort,
    auth,
  );
  const inactive = {
    id: 'c1',
    name: 'Education',
    slug: 'education',
    isActive: false,
  };
  beforeEach(() => {
    jest.resetAllMocks();
    const template = PageTemplate.create({
      id: 't1',
      workspaceId: 'w1',
      sourcePageId: null,
      name: 'Template',
      createdBy: 'creator',
    });
    template.updateMetadata({ visibility: TemplateVisibility.PUBLIC });
    const version = TemplateVersion.create({
      id: 'v1',
      templateId: 't1',
      versionNumber: 1,
      createdBy: 'creator',
    });
    version.publish();
    const listing = TemplateListing.create({
      id: 'l1',
      templateId: 't1',
      createdBy: 'creator',
    });
    listing.selectPublishedVersion(version);
    listing.publish();
    templates.findById.mockResolvedValue(template);
    templates.findByIdForUpdate.mockResolvedValue(template);
    versions.findById.mockResolvedValue(version);
    listings.findByTemplateId.mockResolvedValue(listing);
    listings.findCategoriesByTemplateIds.mockResolvedValue(
      new Map([['t1', [inactive]]]),
    );
    listings.save.mockImplementation((value) => Promise.resolve(value));
    listings.create.mockImplementation((value) => Promise.resolve(value));
    authorization.authorize.mockResolvedValue(false);
  });
  it('returns inactive categories to the creator without changing membership', async () => {
    const result = await handler.execute(
      new GetTemplateListingQuery('t1', 'creator'),
    );
    expect(result.category_ids).toEqual(['c1']);
    expect(result.categories[0].is_active).toBe(false);
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(['t1'], {
      activeOnly: false,
    });
    expect(listings.save).not.toHaveBeenCalled();
  });
  it('does not read categories before authorization', async () => {
    await expect(
      handler.execute(new GetTemplateListingQuery('t1', 'other')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(listings.findCategoriesByTemplateIds).not.toHaveBeenCalled();
  });
  it('does not read categories for a missing listing', async () => {
    listings.findByTemplateId.mockResolvedValue(null);
    await expect(
      handler.execute(new GetTemplateListingQuery('t1', 'creator')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(listings.findCategoriesByTemplateIds).not.toHaveBeenCalled();
  });
  it('returns empty arrays for a listing with no categories', async () => {
    listings.findCategoriesByTemplateIds.mockResolvedValue(
      new Map([['t1', []]]),
    );
    const result = await handler.execute(
      new GetTemplateListingQuery('t1', 'creator'),
    );
    expect(result.category_ids).toEqual([]);
    expect(result.categories).toEqual([]);
  });
  it('hydrates legacy publish and unpublish responses within their existing transaction', async () => {
    const publish = new PublishTemplateListingHandler(
      templatePort,
      listingPort,
      versions as unknown as TemplateVersionRepository,
      uow,
      auth,
    );
    const published = await publish.execute(
      new PublishTemplateListingCommand('t1', 'creator'),
    );
    const unpublish = new UnpublishTemplateListingHandler(
      templatePort,
      listingPort,
      uow,
      auth,
    );
    const unpublished = await unpublish.execute(
      new UnpublishTemplateListingCommand('t1', 'creator'),
    );
    expect(published.category_ids).toEqual(['c1']);
    expect(unpublished.category_ids).toEqual(['c1']);
    expect(unpublished.status).toBe('DRAFT');
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(
      ['t1'],
      { activeOnly: false },
      context,
    );
  });
  it('hydrates the newly created listing response', async () => {
    listings.findByTemplateId.mockResolvedValue(null);
    listings.findCategoriesByTemplateIds.mockResolvedValue(
      new Map([['t1', []]]),
    );
    const create = new CreateTemplateListingHandler(
      templatePort,
      versions as any,
      listingPort,
      uow,
      auth,
    );
    const result = await create.execute(
      new CreateTemplateListingCommand('t1', 'creator'),
    );
    expect(result.categories).toEqual([]);
    expect(result.status).toBe('DRAFT');
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(
      ['t1'],
      { activeOnly: false },
      context,
    );
  });
});
