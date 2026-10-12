import { NotFoundException } from '@nestjs/common';
import { GetPublicTemplateDetailHandler } from './get-public-template-detail.handler';
import { GetPublicTemplateDetailQuery } from './get-public-template-detail.query';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type {
  TemplateListingRepository,
  TemplateListingCategoryInfo,
} from '../../../../domain/repositories/template-listing.repository';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';

describe('GetPublicTemplateDetailHandler category enrichment', () => {
  const templates = { findPublicById: jest.fn() };
  const listings = { findCategoriesByTemplateIds: jest.fn() };
  const handler = new GetPublicTemplateDetailHandler(
    templates as unknown as PageTemplateRepository,
    listings as unknown as TemplateListingRepository,
  );
  const template = PageTemplate.create({
    id: 't1',
    workspaceId: 'w1',
    sourcePageId: null,
    name: 'Template',
    createdBy: 'creator',
  });
  const version = TemplateVersion.create({
    id: 'pinned',
    templateId: 't1',
    versionNumber: 1,
    createdBy: 'creator',
  });
  version.publish();
  const categories: TemplateListingCategoryInfo[] = [
    { id: 'a', name: 'Esports', slug: 'esports', isActive: true },
    { id: 'b', name: 'Gaming', slug: 'gaming', isActive: true },
    { id: 'c', name: 'Hidden', slug: 'hidden', isActive: false },
  ];
  beforeEach(() => {
    jest.resetAllMocks();
    templates.findPublicById.mockResolvedValue({ template, version });
    listings.findCategoriesByTemplateIds.mockImplementation(
      async (_ids: string[], options: { activeOnly?: boolean }) =>
        new Map([
          [
            't1',
            categories.filter(
              (category) => !options.activeOnly || category.isActive,
            ),
          ],
        ]),
    );
  });
  it('adds only active public metadata and preserves every template/version field', async () => {
    const result = await handler.execute(
      new GetPublicTemplateDetailQuery('t1'),
    );
    expect(result).toEqual({
      ...PageTemplateResponseDto.fromDomain(template),
      version: TemplateVersionResponseDto.fromDomain(version),
      categories: [
        { id: 'a', name: 'Esports', slug: 'esports' },
        { id: 'b', name: 'Gaming', slug: 'gaming' },
      ],
    });
    expect(templates.findPublicById).toHaveBeenCalledWith('t1');
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(['t1'], {
      activeOnly: true,
    });
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledTimes(1);
  });
  it('returns an empty category array when none are assigned', async () => {
    listings.findCategoriesByTemplateIds.mockResolvedValue(new Map());
    expect(
      (await handler.execute(new GetPublicTemplateDetailQuery('t1')))
        .categories,
    ).toEqual([]);
  });
  it('returns 404 without reading categories when the public lookup fails', async () => {
    templates.findPublicById.mockResolvedValue(null);
    await expect(
      handler.execute(new GetPublicTemplateDetailQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(listings.findCategoriesByTemplateIds).not.toHaveBeenCalled();
  });
  it('uses the actual template ID returned by the public lookup', async () => {
    await handler.execute(new GetPublicTemplateDetailQuery('request-id'));
    expect(listings.findCategoriesByTemplateIds).toHaveBeenCalledWith(['t1'], {
      activeOnly: true,
    });
  });
});
