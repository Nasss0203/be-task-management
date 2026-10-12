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
import type { TemplateCategoryRepository } from '../../../domain/repositories/template-category.repository';
import { TemplateCategory } from '../../../domain/aggregates/template-category/template-category.aggregate';
import { ValidationPipe } from '@nestjs/common';
import { PublishTemplateToMarketplaceRequest } from '../../../presentation/http/requests/publish-template-to-marketplace.request';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

describe('PublishTemplateToMarketplaceHandler', () => {
  const context = {};
  let template: PageTemplate;
  let version: TemplateVersion;
  let listing: TemplateListing | null;
  const templates = { findByIdForUpdate: jest.fn(), save: jest.fn() };
  const versions = { findByIdForUpdate: jest.fn(), save: jest.fn() };
  const listings = {
    findByTemplateId: jest.fn(),
    save: jest.fn(),
    replaceCategoryIds: jest.fn(),
    findCategoriesByTemplateIds: jest.fn(),
  };
  const categories = { findByIdsForShare: jest.fn() };
  let categoryIds: string[];
  const auth = { authorize: jest.fn() };
  const uow: UnitOfWork = { runInTransaction: (fn) => fn(context) };
  const handler = new PublishTemplateToMarketplaceHandler(
    templates as unknown as PageTemplateRepository,
    versions as unknown as TemplateVersionRepository,
    listings as unknown as TemplateListingRepository,
    uow,
    auth as unknown as AuthorizationService,
    categories as unknown as TemplateCategoryRepository,
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
    categoryIds = [];
    listings.findCategoriesByTemplateIds.mockImplementation(() =>
      Promise.resolve(
        new Map([
          [
            't1',
            categoryIds.map((id) => ({
              id,
              name: id,
              slug: id,
              isActive: true,
            })),
          ],
        ]),
      ),
    );
    categories.findByIdsForShare.mockImplementation((ids: string[]) =>
      Promise.resolve(
        ids.map((id) => TemplateCategory.create({ id, name: id })),
      ),
    );
    listings.replaceCategoryIds.mockImplementation(
      (_id: string, ids: string[]) => {
        categoryIds = [...ids];
        return Promise.resolve();
      },
    );
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
  const withCategories = (ids?: string[]) =>
    new PublishTemplateToMarketplaceCommand(
      't1',
      'v1',
      'creator',
      TemplateOfferType.FREE,
      ids,
    );
  it.each([['a'], ['a', 'b']])(
    'assigns active categories: %j',
    async (...ids: string[]) => {
      const result = await handler.execute(withCategories(ids));
      expect(categoryIds).toEqual(ids);
      expect(result.listing.category_ids).toEqual(ids);
      expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(
        ['t1'],
        { activeOnly: false },
        context,
      );
      expect(categories.findByIdsForShare).toHaveBeenCalledWith(ids, context);
      expect(listings.replaceCategoryIds).toHaveBeenCalledWith(
        result.listing.id,
        ids,
        context,
      );
    },
  );
  it('rejects missing categories before publish writes', async () => {
    categories.findByIdsForShare.mockResolvedValue([]);
    await expect(
      handler.execute(withCategories(['missing'])),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(versions.save).not.toHaveBeenCalled();
    expect(templates.save).not.toHaveBeenCalled();
    expect(listings.save).not.toHaveBeenCalled();
    expect(listings.replaceCategoryIds).not.toHaveBeenCalled();
  });
  it('rejects a request containing an inactive category before writes', async () => {
    categories.findByIdsForShare.mockResolvedValue([
      TemplateCategory.create({ id: 'a', name: 'Active' }),
      TemplateCategory.create({ id: 'b', name: 'Inactive', isActive: false }),
    ]);
    await expect(
      handler.execute(withCategories(['a', 'b'])),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(versions.save).not.toHaveBeenCalled();
    expect(templates.save).not.toHaveBeenCalled();
    expect(listings.save).not.toHaveBeenCalled();
    expect(listings.replaceCategoryIds).not.toHaveBeenCalled();
  });
  it('normalizes casing and removes duplicate IDs', async () => {
    await handler.execute(withCategories(['ABC', 'abc', 'DEF']));
    expect(categoryIds).toEqual(['abc', 'def']);
    expect(categories.findByIdsForShare).toHaveBeenCalledWith(
      ['abc', 'def'],
      context,
    );
  });
  it('replaces categories on same-version republish without saving the listing again', async () => {
    const first = await handler.execute(withCategories(['a']));
    const second = await handler.execute(withCategories(['b']));
    expect(second.listing.id).toEqual(first.listing.id);
    expect(second.listing.published_at).toEqual(first.listing.published_at);
    expect(second.listing.category_ids).toEqual(['b']);
    expect(listings.save).toHaveBeenCalledTimes(1);
    expect(categoryIds).toEqual(['b']);
  });
  it('keeps previous categories when omitted and clears them for an empty array', async () => {
    await handler.execute(withCategories(['a']));
    const omitted = await handler.execute(withCategories());
    expect(omitted.listing.category_ids).toEqual(['a']);
    expect(categoryIds).toEqual(['a']);
    expect(listings.replaceCategoryIds).toHaveBeenCalledTimes(1);
    const cleared = await handler.execute(withCategories([]));
    expect(cleared.listing.category_ids).toEqual([]);
    expect(cleared.listing.categories).toEqual([]);
    expect(categoryIds).toEqual([]);
  });
  it('does not access category repositories for omitted input', async () => {
    await handler.execute(command());
    expect(categories.findByIdsForShare).not.toHaveBeenCalled();
    expect(listings.replaceCategoryIds).not.toHaveBeenCalled();
  });
  it('propagates association failure to the existing transaction boundary', async () => {
    const error = new Error('association failure');
    listings.replaceCategoryIds.mockRejectedValueOnce(error);
    await expect(handler.execute(withCategories(['a']))).rejects.toBe(error);
    expect(listings.save).toHaveBeenCalled();
  });
  it('keeps authorization ahead of category access', async () => {
    await expect(
      handler.execute(
        new PublishTemplateToMarketplaceCommand(
          't1',
          'v1',
          'other',
          TemplateOfferType.FREE,
          ['a'],
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(categories.findByIdsForShare).not.toHaveBeenCalled();
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

describe('Marketplace publish request validation', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const validate = (input: Record<string, unknown>) =>
    pipe.transform(
      {
        version_id: '550e8400-e29b-41d4-a716-446655440000',
        offer_type: 'FREE',
        ...input,
      },
      { type: 'body', metatype: PublishTemplateToMarketplaceRequest },
    );
  it.each([
    {},
    { category_ids: [] },
    { category_ids: ['550e8400-e29b-41d4-a716-446655440001'] },
  ])('accepts valid input %j', async (input) => {
    await expect(validate(input)).resolves.toBeInstanceOf(
      PublishTemplateToMarketplaceRequest,
    );
  });
  it.each([null, 'text', 42, ['invalid'], [null], [42]])(
    'rejects invalid category_ids %j',
    async (category_ids) => {
      await expect(validate({ category_ids })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
});
