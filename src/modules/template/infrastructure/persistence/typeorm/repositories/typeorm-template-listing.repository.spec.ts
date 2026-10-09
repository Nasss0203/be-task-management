import 'reflect-metadata';
import type { DataSource, EntityManager } from 'typeorm';

import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';
import { TypeOrmTemplateListingRepository } from './typeorm-template-listing.repository';

describe('TypeOrmTemplateListingRepository', () => {
  let mockOrmRepo: {
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let mockDataSource: {
    getRepository: jest.Mock;
  };
  let repository: TypeOrmTemplateListingRepository;

  beforeEach(() => {
    mockOrmRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
    };
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockOrmRepo),
    };
    repository = new TypeOrmTemplateListingRepository(
      mockDataSource as unknown as DataSource,
    );
  });

  describe('create and save', () => {
    it('creates and saves a listing through ORM repository', async () => {
      const listing = TemplateListing.create({
        id: 'listing-1',
        templateId: 'template-1',
        createdBy: 'user-1',
      });

      mockOrmRepo.save.mockImplementation((entity: TemplateListingOrmEntity) =>
        Promise.resolve(entity),
      );

      const created = await repository.create(listing);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        TemplateListingOrmEntity,
      );
      expect(mockOrmRepo.save).toHaveBeenCalledTimes(1);
      expect(created.getId()).toBe('listing-1');
      expect(created.getStatus()).toBe(TemplateListingStatus.DRAFT);
      expect(created.getOfferType()).toBe(TemplateOfferType.FREE);
    });

    it('persists PUBLISHED status and publishedAt date on save', async () => {
      const listing = TemplateListing.create({
        id: 'listing-1',
        templateId: 'template-1',
        createdBy: 'user-1',
      });

      listing.publish();

      mockOrmRepo.save.mockImplementation((entity: TemplateListingOrmEntity) =>
        Promise.resolve(entity),
      );

      const saved = await repository.save(listing);

      expect(saved.getStatus()).toBe(TemplateListingStatus.PUBLISHED);
      expect(saved.getPublishedAt()).toBeInstanceOf(Date);
      expect(saved.isPublished()).toBe(true);
    });

    it('persists DRAFT status and null publishedAt on save after unpublish', async () => {
      const listing = TemplateListing.restore({
        id: 'listing-1',
        templateId: 'template-1',
        offerType: TemplateOfferType.FREE,
        status: TemplateListingStatus.PUBLISHED,
        createdBy: 'user-1',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      listing.unpublish();

      mockOrmRepo.save.mockImplementation((entity: TemplateListingOrmEntity) =>
        Promise.resolve(entity),
      );

      const saved = await repository.save(listing);

      expect(saved.getStatus()).toBe(TemplateListingStatus.DRAFT);
      expect(saved.getPublishedAt()).toBeNull();
      expect(saved.isDraft()).toBe(true);
    });
  });

  describe('findById', () => {
    it('returns restored domain aggregate when found', async () => {
      const entity = new TemplateListingOrmEntity();
      entity.id = 'listing-1';
      entity.templateId = 'template-1';
      entity.offerType = TemplateOfferType.FREE;
      entity.status = TemplateListingStatus.DRAFT;
      entity.createdBy = 'user-1';
      entity.publishedAt = null;
      entity.createdAt = new Date('2026-01-01T00:00:00Z');
      entity.updatedAt = new Date('2026-01-01T00:00:00Z');

      mockOrmRepo.findOne.mockResolvedValue(entity);

      const found = await repository.findById('listing-1');

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
      });
      expect(found).not.toBeNull();
      expect(found?.getId()).toBe('listing-1');
      expect(found?.getTemplateId()).toBe('template-1');
    });

    it('returns null when listing is not found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findByTemplateId', () => {
    it('returns domain aggregate when listing for templateId exists', async () => {
      const entity = new TemplateListingOrmEntity();
      entity.id = 'listing-1';
      entity.templateId = 'template-1';
      entity.offerType = TemplateOfferType.FREE;
      entity.status = TemplateListingStatus.PUBLISHED;
      entity.createdBy = 'user-1';
      entity.publishedAt = new Date('2026-02-01T00:00:00Z');
      entity.createdAt = new Date('2026-01-01T00:00:00Z');
      entity.updatedAt = new Date('2026-02-01T00:00:00Z');

      mockOrmRepo.findOne.mockResolvedValue(entity);

      const found = await repository.findByTemplateId('template-1');

      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { templateId: 'template-1' },
      });
      expect(found).not.toBeNull();
      expect(found?.getTemplateId()).toBe('template-1');
      expect(found?.isPublished()).toBe(true);
    });

    it('returns null when no listing exists for templateId', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const found = await repository.findByTemplateId(
        'template-without-listing',
      );

      expect(found).toBeNull();
    });
  });

  describe('PersistenceContext support', () => {
    it('uses the provided context/EntityManager when supplied', async () => {
      const contextRepo = {
        save: jest
          .fn()
          .mockImplementation((e: TemplateListingOrmEntity) =>
            Promise.resolve(e),
          ),
        findOne: jest.fn(),
      };
      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(contextRepo),
      };

      const listing = TemplateListing.create({
        id: 'listing-ctx',
        templateId: 'template-ctx',
        createdBy: 'user-ctx',
      });

      await repository.save(
        listing,
        mockEntityManager as unknown as EntityManager,
      );

      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        TemplateListingOrmEntity,
      );
      expect(contextRepo.save).toHaveBeenCalled();
      expect(mockDataSource.getRepository).not.toHaveBeenCalled();
    });
  });
});
