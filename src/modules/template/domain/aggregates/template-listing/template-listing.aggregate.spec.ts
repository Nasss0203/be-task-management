import { TemplateListingStatus } from '../../../../marketplace/domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../marketplace/domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../../marketplace/domain/enums/template-preview-mode.enum';
import { TemplatePrice } from '../../../../marketplace/domain/value-objects/template-price.vo';
import { TemplateListing } from '../../../../marketplace/domain/aggregates/template-listing/template-listing.aggregate';

describe('TemplateListingAggregate', () => {
  const validTemplateId = 'template-uuid-1';
  const validUserId = 'user-uuid-1';

  describe('create', () => {
    it('creates a listing with default values', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
      });

      expect(listing.getId()).toBeDefined();
      expect(typeof listing.getId()).toBe('string');
      expect(listing.getTemplateId()).toBe(validTemplateId);
      expect(listing.getOfferType()).toBe(TemplateOfferType.FREE);
      expect(listing.getStatus()).toBe(TemplateListingStatus.DRAFT);
      expect(listing.getCreatedBy()).toBe(validUserId);
      expect(listing.getPublishedAt()).toBeNull();
      expect(listing.getCreatedAt()).toBeInstanceOf(Date);
      expect(listing.getUpdatedAt()).toBeInstanceOf(Date);
      expect(listing.isDraft()).toBe(true);
      expect(listing.isPublished()).toBe(false);
    });

    it('uses provided id and timestamps when given', () => {
      const customId = 'custom-listing-id';
      const customCreatedAt = new Date('2026-01-01T00:00:00.000Z');
      const customUpdatedAt = new Date('2026-01-02T00:00:00.000Z');

      const listing = TemplateListing.create({
        id: customId,
        templateId: validTemplateId,
        offerType: TemplateOfferType.FREE,
        createdBy: validUserId,
        createdAt: customCreatedAt,
        updatedAt: customUpdatedAt,
      });

      expect(listing.getId()).toBe(customId);
      expect(listing.getCreatedAt()).toBe(customCreatedAt);
      expect(listing.getUpdatedAt()).toBe(customUpdatedAt);
    });

    it('throws error when templateId is empty', () => {
      expect(() =>
        TemplateListing.create({
          templateId: '   ',
          createdBy: validUserId,
        }),
      ).toThrow('Template id is required');
    });

    it('throws error when createdBy is empty', () => {
      expect(() =>
        TemplateListing.create({
          templateId: validTemplateId,
          createdBy: '   ',
        }),
      ).toThrow('Created by is required');
    });
  });

  describe('restore', () => {
    it('restores exact persisted state', () => {
      const id = 'persisted-listing-id';
      const publishedAt = new Date('2026-02-01T12:00:00.000Z');
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-02-01T12:00:00.000Z');

      const listing = TemplateListing.restore({
        id,
        templateId: validTemplateId,
        offerType: TemplateOfferType.FREE,
        status: TemplateListingStatus.PUBLISHED,
        createdBy: validUserId,
        publishedAt,
        createdAt,
        updatedAt,
      });

      expect(listing.getId()).toBe(id);
      expect(listing.getTemplateId()).toBe(validTemplateId);
      expect(listing.getOfferType()).toBe(TemplateOfferType.FREE);
      expect(listing.getStatus()).toBe(TemplateListingStatus.PUBLISHED);
      expect(listing.getCreatedBy()).toBe(validUserId);
      expect(listing.getPublishedAt()).toEqual(publishedAt);
      expect(listing.getCreatedAt()).toEqual(createdAt);
      expect(listing.getUpdatedAt()).toEqual(updatedAt);
      expect(listing.isPublished()).toBe(true);
      expect(listing.isDraft()).toBe(false);
    });
  });

  describe('publish', () => {
    it('transitions from DRAFT to PUBLISHED with publishedAt and updatedAt', () => {
      const initialDate = new Date('2026-01-01T00:00:00.000Z');
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        createdAt: initialDate,
        updatedAt: initialDate,
      });

      listing.publish();

      expect(listing.getStatus()).toBe(TemplateListingStatus.PUBLISHED);
      expect(listing.isPublished()).toBe(true);
      expect(listing.isDraft()).toBe(false);
      expect(listing.getPublishedAt()).toBeInstanceOf(Date);
      expect(listing.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        initialDate.getTime(),
      );
    });

    it('is idempotent when already PUBLISHED', () => {
      const initialPublishDate = new Date('2026-02-01T10:00:00.000Z');
      const listing = TemplateListing.restore({
        id: 'listing-1',
        templateId: validTemplateId,
        offerType: TemplateOfferType.FREE,
        status: TemplateListingStatus.PUBLISHED,
        createdBy: validUserId,
        publishedAt: initialPublishDate,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: initialPublishDate,
      });

      listing.publish();

      expect(listing.getStatus()).toBe(TemplateListingStatus.PUBLISHED);
      expect(listing.getPublishedAt()).toBe(initialPublishDate);
      expect(listing.getUpdatedAt()).toBe(initialPublishDate);
    });
  });

  describe('unpublish', () => {
    it('transitions from PUBLISHED to DRAFT and resets publishedAt to null', () => {
      const publishedAt = new Date('2026-02-01T10:00:00.000Z');
      const listing = TemplateListing.restore({
        id: 'listing-1',
        templateId: validTemplateId,
        offerType: TemplateOfferType.FREE,
        status: TemplateListingStatus.PUBLISHED,
        createdBy: validUserId,
        publishedAt,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: publishedAt,
      });

      listing.unpublish();

      expect(listing.getStatus()).toBe(TemplateListingStatus.DRAFT);
      expect(listing.isDraft()).toBe(true);
      expect(listing.isPublished()).toBe(false);
      expect(listing.getPublishedAt()).toBeNull();
      expect(listing.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        publishedAt.getTime(),
      );
    });

    it('is idempotent when already DRAFT', () => {
      const initialUpdatedAt = new Date('2026-01-01T00:00:00.000Z');
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        createdAt: initialUpdatedAt,
        updatedAt: initialUpdatedAt,
      });

      listing.unpublish();

      expect(listing.getStatus()).toBe(TemplateListingStatus.DRAFT);
      expect(listing.getPublishedAt()).toBeNull();
      expect(listing.getUpdatedAt()).toBe(initialUpdatedAt);
    });
  });

  describe('previewMode', () => {
    it('defaults to INTERACTIVE for FREE listing when not configured', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.FREE,
      });

      expect(listing.getPreviewMode()).toBe(TemplatePreviewMode.INTERACTIVE);
    });

    it('defaults to IMAGE for PAID listing when not configured', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 50000, currency: 'VND' }),
      });

      expect(listing.getPreviewMode()).toBe(TemplatePreviewMode.IMAGE);
    });

    it('uses configured previewMode when explicitly passed on create', () => {
      const listingFree = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.FREE,
        previewMode: TemplatePreviewMode.IMAGE,
      });
      expect(listingFree.getPreviewMode()).toBe(TemplatePreviewMode.IMAGE);

      const listingPaid = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 50000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
      });
      expect(listingPaid.getPreviewMode()).toBe(
        TemplatePreviewMode.INTERACTIVE,
      );
    });

    it('allows changing previewMode via setPreviewMode', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
      });
      expect(listing.getPreviewMode()).toBe(TemplatePreviewMode.INTERACTIVE);

      const changed = listing.setPreviewMode(TemplatePreviewMode.IMAGE);
      expect(changed).toBe(true);
      expect(listing.getPreviewMode()).toBe(TemplatePreviewMode.IMAGE);

      const idempotent = listing.setPreviewMode(TemplatePreviewMode.IMAGE);
      expect(idempotent).toBe(false);
    });

    it('defaults to IMAGE when configuring offer from FREE to PAID without explicit previewMode', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.FREE,
      });
      expect(listing.getPreviewMode()).toBe(TemplatePreviewMode.INTERACTIVE);

      const changed = listing.configureOffer(
        TemplateOfferType.PAID,
        TemplatePrice.create({ amount: 100000, currency: 'VND' }),
      );
      expect(changed).toBe(true);
      expect(listing.getPreviewMode()).toBe(TemplatePreviewMode.IMAGE);
    });

    it('applies explicit previewMode in configureOffer', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.FREE,
      });

      listing.configureOffer(
        TemplateOfferType.PAID,
        TemplatePrice.create({ amount: 100000, currency: 'VND' }),
        TemplatePreviewMode.INTERACTIVE,
      );
      expect(listing.getPreviewMode()).toBe(
        TemplatePreviewMode.INTERACTIVE,
      );
    });
  });

  describe('demoPreview isolation', () => {
    it('sets and updates demoVersionId and demoConfig', () => {
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 100000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
      });

      const changed = listing.setDemoPreview('demo-version-uuid', { tab: 'overview' });
      expect(changed).toBe(true);
      expect(listing.getDemoVersionId()).toBe('demo-version-uuid');
      expect(listing.getDemoConfig()).toEqual({ tab: 'overview' });

      const idempotent = listing.setDemoPreview('demo-version-uuid', { tab: 'overview' });
      expect(idempotent).toBe(false);
    });

    it('rejects setting demoVersionId equal to publishedVersionId for PAID listing', () => {
      const publishedVerId = 'published-ver-uuid';
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 100000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
      });

      listing.selectPublishedVersion({
        getId: () => publishedVerId,
        getTemplateId: () => validTemplateId,
        isDraft: () => false,
      });

      expect(() => {
        listing.setDemoPreview(publishedVerId);
      }).toThrow('Demo version cannot be the same as the published paid version');
    });

    it('rejects selectPublishedVersion if it matches demoVersionId for PAID listing', () => {
      const demoVerId = 'demo-ver-uuid';
      const listing = TemplateListing.create({
        templateId: validTemplateId,
        createdBy: validUserId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 100000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
        demoVersionId: demoVerId,
      });

      expect(() => {
        listing.selectPublishedVersion({
          getId: () => demoVerId,
          getTemplateId: () => validTemplateId,
          isDraft: () => false,
        });
      }).toThrow('Demo version cannot be the same as the published paid version');
    });
  });
});
