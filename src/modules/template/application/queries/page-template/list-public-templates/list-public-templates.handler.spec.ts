import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ListPublicTemplatesRequest } from '../../../../../marketplace/presentation/http/requests/list-public-templates.request';
import { ListPublicTemplatesHandler } from '../../../../../marketplace/application/queries/page-template/list-public-templates/list-public-templates.handler';
import { ListPublicTemplatesQuery } from '../../../../../marketplace/application/queries/page-template/list-public-templates/list-public-templates.query';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type {
  TemplateListingRepository,
  TemplateListingCategoryInfo,
} from '../../../../../marketplace/domain/repositories/template-listing.repository';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import {
  encodeTemplateListCursor,
  decodeTemplateListCursor,
} from '../list-page-templates/template-list-cursor.helper';

import { TemplateListing } from '../../../../../marketplace/domain/aggregates/template-listing/template-listing.aggregate';
import { TemplatePreviewMode } from '../../../../../marketplace/domain/enums/template-preview-mode.enum';

describe('ListPublicTemplatesHandler category enrichment', () => {
  const templates = { findMany: jest.fn() };
  const listings = {
    findTagsByTemplateIds: jest.fn().mockResolvedValue(new Map()),
    findCategoriesByTemplateIds: jest.fn(),
    findByTemplateIds: jest.fn(),
  };
  const creators = { findProfiles: jest.fn().mockResolvedValue(new Map()) };
  const feedback = { getSummaries: jest.fn().mockResolvedValue(new Map()) };
  const handler = new ListPublicTemplatesHandler(
    templates as unknown as PageTemplateRepository,
    listings as unknown as TemplateListingRepository,
    creators as never,
    feedback as never,
  );
  const first = PageTemplate.create({
    id: '550e8400-e29b-41d4-a716-446655440001',
    workspaceId: 'w1',
    sourcePageId: null,
    name: 'First',
    createdBy: 'creator',
    createdAt: new Date('2026-10-12T02:00:00Z'),
  });
  const second = PageTemplate.create({
    id: '550e8400-e29b-41d4-a716-446655440002',
    workspaceId: 'w1',
    sourcePageId: null,
    name: 'Second',
    createdBy: 'creator',
    createdAt: new Date('2026-10-12T01:00:00Z'),
  });
  const third = PageTemplate.create({
    id: '550e8400-e29b-41d4-a716-446655440003',
    workspaceId: 'w1',
    sourcePageId: null,
    name: 'No categories',
    createdBy: 'creator',
  });
  const version = TemplateVersion.create({
    id: 'pinned',
    templateId: first.getId(),
    versionNumber: 1,
    createdBy: 'creator',
  });
  version.publish();
  const memberships = new Map<string, TemplateListingCategoryInfo[]>([
    [
      first.getId(),
      [
        { id: 'a', name: 'Esports', slug: 'esports', isActive: true },
        { id: 'inactive', name: 'Hidden', slug: 'hidden', isActive: false },
      ],
    ],
    [
      second.getId(),
      [{ id: 'b', name: 'Gaming', slug: 'gaming', isActive: true }],
    ],
  ]);
  beforeEach(() => {
    jest.resetAllMocks();
    feedback.getSummaries.mockResolvedValue(new Map());
    listings.findTagsByTemplateIds.mockResolvedValue(new Map());
    creators.findProfiles.mockResolvedValue(new Map());
    templates.findMany.mockResolvedValue({
      items: [first, second],
      versions: new Map([[first.getId(), version]]),
      hasNextPage: true,
    });
    listings.findCategoriesByTemplateIds.mockImplementation(
      async (ids: string[], options: { activeOnly?: boolean }) =>
        new Map(
          ids.map((id) => [
            id,
            (memberships.get(id) ?? []).filter(
              (category) => !options.activeOnly || category.isActive,
            ),
          ]),
        ),
    );
    listings.findByTemplateIds.mockImplementation(async (ids: string[]) =>
      new Map(
        ids.map((id) => [
          id,
          TemplateListing.create({
            templateId: id,
            createdBy: 'creator',
            previewMode: TemplatePreviewMode.INTERACTIVE,
          }),
        ]),
      ),
    );
  });
  it('enriches a page in one batch, preserves order, metadata and represented version, and exposes only public category fields', async () => {
    const result = await handler.execute(new ListPublicTemplatesQuery());
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledTimes(1);
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(
      [first.getId(), second.getId()],
      { activeOnly: true },
    );
    expect(result.items).toEqual([
      {
        ...PageTemplateResponseDto.fromDomain(first),
        version: TemplateVersionResponseDto.fromDomain(version),
        categories: [{ id: 'a', name: 'Esports', slug: 'esports' }],
        tags: [],
        creator: null,
        rating_average: null,
        rating_count: 0,
        like_count: 0,
        offer_type: 'FREE',
        price_amount: 0,
        currency: 'VND',
        preview_mode: 'INTERACTIVE',
      },
      {
        ...PageTemplateResponseDto.fromDomain(second),
        version: null,
        categories: [{ id: 'b', name: 'Gaming', slug: 'gaming' }],
        tags: [],
        creator: null,
        rating_average: null,
        rating_count: 0,
        like_count: 0,
        offer_type: 'FREE',
        price_amount: 0,
        currency: 'VND',
        preview_mode: 'INTERACTIVE',
      },
    ]);
    expect(decodeTemplateListCursor(result.nextCursor!)).toEqual({
      createdAt: second.getCreatedAt(),
      id: second.getId(),
    });
  });
  it('keeps a template with no categories in the page', async () => {
    templates.findMany.mockResolvedValue({
      items: [third],
      versions: new Map(),
      hasNextPage: false,
    });
    const result = await handler.execute(new ListPublicTemplatesQuery());
    expect(result.items[0].id).toBe(third.getId());
    expect(result.items[0].categories).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
  it('skips category lookup for an empty page', async () => {
    templates.findMany.mockResolvedValue({
      items: [],
      versions: new Map(),
      hasNextPage: false,
    });
    expect(await handler.execute(new ListPublicTemplatesQuery())).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(listings.findCategoriesByTemplateIds).not.toHaveBeenCalled();
  });
  it('preserves search, cursor and limit forwarding', async () => {
    const payload = { createdAt: first.getCreatedAt(), id: first.getId() };
    await handler.execute(
      new ListPublicTemplatesQuery(
        '  esports  ',
        encodeTemplateListCursor(payload),
        2,
      ),
    );
    expect(templates.findMany).toHaveBeenCalledWith({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      search: 'esports',
      sort: 'newest',
      cursor: payload,
      limit: 2,
    });
  });
  it.each([0, 101, 1.5])(
    'rejects invalid limit %s before querying',
    async (limit) => {
      await expect(
        handler.execute(
          new ListPublicTemplatesQuery(undefined, undefined, limit),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(templates.findMany).not.toHaveBeenCalled();
      expect(listings.findCategoriesByTemplateIds).not.toHaveBeenCalled();
    },
  );
  it('preserves default limit and rejects malformed cursor', async () => {
    await handler.execute(new ListPublicTemplatesQuery());
    expect(templates.findMany.mock.calls[0][0].limit).toBe(20);
    jest.clearAllMocks();
    await expect(
      handler.execute(new ListPublicTemplatesQuery(undefined, 'invalid')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(templates.findMany).not.toHaveBeenCalled();
  });
  it('forwards normalized category with search and cursor without filtering the returned page', async () => {
    const cursor = encodeTemplateListCursor({
      createdAt: first.getCreatedAt(),
      id: first.getId(),
    });
    const result = await handler.execute(
      new ListPublicTemplatesQuery(' team ', cursor, 2, ' Esports '),
    );
    expect(templates.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySlug: 'esports',
        search: 'team',
        limit: 2,
        cursor: { createdAt: first.getCreatedAt(), id: first.getId() },
      }),
    );
    expect(result.items.map((item) => item.id)).toEqual([
      first.getId(),
      second.getId(),
    ]);
    expect(decodeTemplateListCursor(result.nextCursor!)).toEqual({
      createdAt: second.getCreatedAt(),
      id: second.getId(),
    });
  });
  it.each(['missing-category', 'inactive-category'])(
    'returns the empty repository result for %s',
    async (category) => {
      templates.findMany.mockResolvedValue({
        items: [],
        versions: new Map(),
        hasNextPage: false,
      });
      expect(
        await handler.execute(
          new ListPublicTemplatesQuery(undefined, undefined, 20, category),
        ),
      ).toEqual({ items: [], nextCursor: null });
      expect(listings.findCategoriesByTemplateIds).not.toHaveBeenCalled();
    },
  );
  it.each(['', ' ', 'bad_slug', 'bad--slug', 'a,b'])(
    'rejects invalid category %j before persistence',
    async (category) => {
      await expect(
        handler.execute(
          new ListPublicTemplatesQuery(undefined, undefined, 20, category),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(templates.findMany).not.toHaveBeenCalled();
    },
  );
});

describe('Public category query validation', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const validate = (input: Record<string, unknown>) =>
    pipe.transform(input, {
      type: 'query',
      metatype: ListPublicTemplatesRequest,
    });
  it('keeps old query fields and normalizes one category slug', async () => {
    const result = await validate({
      category: ' Project-Management ',
      search: 'team',
      cursor: 'cursor',
      limit: '10',
    });
    expect(result).toMatchObject({
      category: 'project-management',
      search: 'team',
      cursor: 'cursor',
      limit: 10,
    });
  });
  it('accepts omitted category and numeric slug segments', async () => {
    await expect(validate({})).resolves.toBeInstanceOf(
      ListPublicTemplatesRequest,
    );
    await expect(validate({ category: 'gaming-2026' })).resolves.toMatchObject({
      category: 'gaming-2026',
    });
  });
  it.each([
    '',
    ' ',
    'bad_slug',
    '-bad',
    'bad-',
    'bad--slug',
    'a,b',
    'a/b',
    'a b',
    ['esports', 'gaming'],
    ['esports'],
    null,
    42,
    '550e8400-e29b-41d4-a716-446655440000',
    'a'.repeat(101),
  ])('rejects invalid or multiple category values %j', async (category) => {
    await expect(validate({ category })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
