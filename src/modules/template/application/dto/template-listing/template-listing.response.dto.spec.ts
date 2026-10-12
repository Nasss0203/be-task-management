import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplateListingResponseDto } from './template-listing.response.dto';

describe('TemplateListingResponseDto', () => {
  const createdAt = new Date('2026-10-09T01:00:00.000Z');
  const updatedAt = new Date('2026-10-09T02:00:00.000Z');

  it('maps all draft listing fields using snake_case and preserves null and Date values', () => {
    const listing = TemplateListing.create({
      id: 'listing-1',
      templateId: 'template-1',
      createdBy: 'user-1',
      createdAt,
      updatedAt,
    });

    const result = TemplateListingResponseDto.fromDomain(listing, []);

    expect(result).toBeInstanceOf(TemplateListingResponseDto);
    expect(result).toEqual({
      id: 'listing-1',
      template_id: 'template-1',
      offer_type: TemplateOfferType.FREE,
      status: TemplateListingStatus.DRAFT,
      created_by: 'user-1',
      published_at: null,
      published_version_id: null,
      created_at: createdAt,
      updated_at: updatedAt,
      category_ids: [],
      categories: [],
    });
    expect(result.created_at).toBe(createdAt);
    expect(result.updated_at).toBe(updatedAt);
  });

  it('preserves a published listing timestamp', () => {
    const publishedAt = new Date('2026-10-09T03:00:00.000Z');
    const listing = TemplateListing.restore({
      id: 'listing-1',
      templateId: 'template-1',
      createdBy: 'user-1',
      offerType: TemplateOfferType.FREE,
      status: TemplateListingStatus.PUBLISHED,
      publishedAt,
      createdAt,
      updatedAt,
    });

    const result = TemplateListingResponseDto.fromDomain(listing, []);

    expect(result.status).toBe(TemplateListingStatus.PUBLISHED);
    expect(result.published_at).toBe(publishedAt);
  });
  it('maps active and inactive category metadata consistently without changing listing fields', () => {
    const listing = TemplateListing.create({
      id: 'l1',
      templateId: 't1',
      createdBy: 'u1',
    });
    const result = TemplateListingResponseDto.fromDomain(listing, [
      { id: 'a', name: 'Active', slug: 'active', isActive: true },
      { id: 'b', name: 'Inactive', slug: 'inactive', isActive: false },
    ]);
    expect(result.category_ids).toEqual(['a', 'b']);
    expect(result.categories).toEqual([
      { id: 'a', name: 'Active', slug: 'active', is_active: true },
      { id: 'b', name: 'Inactive', slug: 'inactive', is_active: false },
    ]);
    expect(result.template_id).toBe('t1');
    expect(result.created_by).toBe('u1');
  });
});
