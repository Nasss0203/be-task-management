import { BadRequestException } from '@nestjs/common';
import { ListPublicTemplatesHandler } from './list-public-templates.handler';
import { ListPublicTemplatesQuery } from './list-public-templates.query';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type {
  TemplateListingRepository,
  TemplateListingCategoryInfo,
} from '../../../../domain/repositories/template-listing.repository';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import {
  encodeTemplateListCursor,
  decodeTemplateListCursor,
} from '../list-page-templates/template-list-cursor.helper';

describe('ListPublicTemplatesHandler category enrichment', () => {
  const templates = { findMany: jest.fn() };
  const listings = { findCategoriesByTemplateIds: jest.fn() };
  const handler = new ListPublicTemplatesHandler(
    templates as unknown as PageTemplateRepository,
    listings as unknown as TemplateListingRepository,
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
      },
      {
        ...PageTemplateResponseDto.fromDomain(second),
        version: null,
        categories: [{ id: 'b', name: 'Gaming', slug: 'gaming' }],
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
});
