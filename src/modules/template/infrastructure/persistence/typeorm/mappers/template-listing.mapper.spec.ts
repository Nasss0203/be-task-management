import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';
import { TemplateListingMapper } from './template-listing.mapper';

describe('TemplateListingMapper', () => {
  const sampleData = {
    id: 'listing-uuid-1',
    templateId: 'template-uuid-1',
    offerType: TemplateOfferType.FREE,
    status: TemplateListingStatus.PUBLISHED,
    createdBy: 'user-uuid-1',
    publishedAt: new Date('2026-03-01T12:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T12:00:00.000Z'),
  };

  it('correctly maps from ORM entity to Domain aggregate', () => {
    const entity = new TemplateListingOrmEntity();
    entity.id = sampleData.id;
    entity.templateId = sampleData.templateId;
    entity.offerType = sampleData.offerType;
    entity.status = sampleData.status;
    entity.createdBy = sampleData.createdBy;
    entity.publishedAt = sampleData.publishedAt;
    entity.createdAt = sampleData.createdAt;
    entity.updatedAt = sampleData.updatedAt;

    const domain = TemplateListingMapper.toDomain(entity);

    expect(domain.getId()).toBe(sampleData.id);
    expect(domain.getTemplateId()).toBe(sampleData.templateId);
    expect(domain.getOfferType()).toBe(sampleData.offerType);
    expect(domain.getStatus()).toBe(sampleData.status);
    expect(domain.getCreatedBy()).toBe(sampleData.createdBy);
    expect(domain.getPublishedAt()).toEqual(sampleData.publishedAt);
    expect(domain.getCreatedAt()).toEqual(sampleData.createdAt);
    expect(domain.getUpdatedAt()).toEqual(sampleData.updatedAt);
    expect(domain.isPublished()).toBe(true);
  });

  it('correctly maps from Domain aggregate to ORM entity', () => {
    const domain = TemplateListing.restore({
      id: sampleData.id,
      templateId: sampleData.templateId,
      offerType: sampleData.offerType,
      status: sampleData.status,
      createdBy: sampleData.createdBy,
      publishedAt: sampleData.publishedAt,
      createdAt: sampleData.createdAt,
      updatedAt: sampleData.updatedAt,
    });

    const entity = TemplateListingMapper.toOrm(domain);

    expect(entity.id).toBe(sampleData.id);
    expect(entity.templateId).toBe(sampleData.templateId);
    expect(entity.offerType).toBe(sampleData.offerType);
    expect(entity.status).toBe(sampleData.status);
    expect(entity.createdBy).toBe(sampleData.createdBy);
    expect(entity.publishedAt).toEqual(sampleData.publishedAt);
    expect(entity.createdAt).toEqual(sampleData.createdAt);
    expect(entity.updatedAt).toEqual(sampleData.updatedAt);
  });

  it('preserves null publishedAt for draft listings in round trip', () => {
    const draftDomain = TemplateListing.create({
      id: 'draft-id',
      templateId: 'template-2',
      createdBy: 'user-2',
    });

    const entity = TemplateListingMapper.toOrm(draftDomain);
    expect(entity.publishedAt).toBeNull();
    expect(entity.status).toBe(TemplateListingStatus.DRAFT);

    const roundTripDomain = TemplateListingMapper.toDomain(entity);
    expect(roundTripDomain.getPublishedAt()).toBeNull();
    expect(roundTripDomain.getStatus()).toBe(TemplateListingStatus.DRAFT);
    expect(roundTripDomain.isDraft()).toBe(true);
  });
});
