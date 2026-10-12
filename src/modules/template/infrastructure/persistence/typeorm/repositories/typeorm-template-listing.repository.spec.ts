import { DataSource, EntityManager, In } from 'typeorm';
import { TypeOrmTemplateListingRepository } from './typeorm-template-listing.repository';
import { TypeOrmTemplateCategoryRepository } from './typeorm-template-category.repository';
import { TemplateListingCategoryOrmEntity } from '../entities/template-listing-category.orm-entity';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';
import { TemplateCategoryOrmEntity } from '../entities/template-category.orm-entity';

describe('Marketplace category persistence', () => {
  const associations = {
    find: jest.fn(),
    delete: jest.fn(),
    insert: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((target: unknown) =>
      target === TemplateListingCategoryOrmEntity ? associations : { manager },
    ),
  };
  const dataSource = { getRepository: jest.fn() };
  const listings = new TypeOrmTemplateListingRepository(
    dataSource as unknown as DataSource,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    associations.find.mockResolvedValue([
      { listingId: 'listing', categoryId: 'a' },
    ]);
    associations.delete.mockResolvedValue({});
    associations.insert.mockResolvedValue({});
  });
  it('uses only the supplied manager and applies the membership difference', async () => {
    await listings.replaceCategoryIds('listing', ['B', 'b'], manager);
    expect(dataSource.getRepository).not.toHaveBeenCalled();
    expect(manager.getRepository).toHaveBeenCalledWith(
      TemplateListingOrmEntity,
    );
    expect(manager.getRepository).toHaveBeenCalledWith(
      TemplateListingCategoryOrmEntity,
    );
    expect(associations.find).toHaveBeenCalledWith({
      where: { listingId: 'listing' },
    });
    expect(associations.delete).toHaveBeenCalledWith({
      listingId: 'listing',
      categoryId: In(['a']),
    });
    expect(associations.insert).toHaveBeenCalledWith([
      { listingId: 'listing', categoryId: 'b' },
    ]);
  });
  it('does not write when membership is unchanged', async () => {
    await listings.replaceCategoryIds('listing', ['a', 'A'], manager);
    expect(associations.delete).not.toHaveBeenCalled();
    expect(associations.insert).not.toHaveBeenCalled();
  });
  it('clears memberships for an empty array', async () => {
    await listings.replaceCategoryIds('listing', [], manager);
    expect(associations.delete).toHaveBeenCalledWith({
      listingId: 'listing',
      categoryId: In(['a']),
    });
    expect(associations.insert).not.toHaveBeenCalled();
  });
  it('propagates insertion failures rather than ignoring them', async () => {
    associations.insert.mockRejectedValueOnce(new Error('insert failure'));
    await expect(
      listings.replaceCategoryIds('listing', ['b'], manager),
    ).rejects.toThrow('insert failure');
  });
  it('requires a context for association writes', async () => {
    await expect(
      listings.replaceCategoryIds('listing', [], undefined),
    ).rejects.toThrow('transaction context');
    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });
  it('batch-reads categories with a sorted share lock on the transaction manager', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const categoryManager = {
      getRepository: jest
        .fn()
        .mockReturnValue({ createQueryBuilder: () => qb }),
    };
    const categories = new TypeOrmTemplateCategoryRepository(
      dataSource as unknown as DataSource,
    );
    await categories.findByIdsForShare(
      ['b', 'a', 'b'],
      categoryManager as unknown as EntityManager,
    );
    expect(categoryManager.getRepository).toHaveBeenCalledWith(
      TemplateCategoryOrmEntity,
    );
    expect(qb.where).toHaveBeenCalledWith('category.id IN (:...ids)', {
      ids: ['a', 'b'],
    });
    expect(qb.orderBy).toHaveBeenCalledWith('category.id', 'ASC');
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_read');
    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });
});
