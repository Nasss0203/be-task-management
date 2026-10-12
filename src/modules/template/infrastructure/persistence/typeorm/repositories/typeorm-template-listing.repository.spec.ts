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

describe('Listing category batch reads', () => {
  const rows = [
    { templateId: 't1', id: 'a', name: 'A', slug: 'a', isActive: true },
    { templateId: 't1', id: 'a', name: 'A', slug: 'a', isActive: true },
    { templateId: 't1', id: 'b', name: 'B', slug: 'b', isActive: false },
    { templateId: 't2', id: 'a', name: 'A', slug: 'a', isActive: true },
  ];
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn().mockReturnValue({ createQueryBuilder: () => qb }),
  };
  const source = { getRepository: jest.fn().mockReturnValue({ manager }) };
  const repository = new TypeOrmTemplateListingRepository(
    source as unknown as DataSource,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    qb.getRawMany.mockResolvedValue(rows);
  });
  it('returns an empty map without accessing persistence for empty input', async () => {
    expect(await repository.findCategoriesByTemplateIds([])).toEqual(new Map());
    expect(source.getRepository).not.toHaveBeenCalled();
    expect(qb.getRawMany).not.toHaveBeenCalled();
  });
  it('groups one batch, deduplicates template/category IDs, includes inactive and initializes empty memberships', async () => {
    const result = await repository.findCategoriesByTemplateIds([
      't1',
      't2',
      't1',
      't3',
    ]);
    expect(qb.getRawMany).toHaveBeenCalledTimes(1);
    expect(qb.where).toHaveBeenCalledWith(
      'listing.templateId IN (:...templateIds)',
      { templateIds: ['t1', 't2', 't3'] },
    );
    expect(qb.innerJoin).toHaveBeenCalledWith('association.listing', 'listing');
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'association.category',
      'category',
    );
    expect(result.get('t1')).toEqual(
      rows
        .filter((row, index) => index === 0 || index === 2)
        .map(({ templateId, ...category }) => category),
    );
    expect(result.get('t2')).toHaveLength(1);
    expect(result.get('t3')).toEqual([]);
    expect(qb.andWhere).not.toHaveBeenCalled();
    expect(qb.orderBy).toHaveBeenCalledWith('category.sortOrder', 'ASC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('category.name', 'ASC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('category.id', 'ASC');
  });
  it('applies activeOnly filtering and uses the supplied context', async () => {
    qb.getRawMany.mockResolvedValue(rows.filter((row) => row.isActive));
    const context = { getRepository: jest.fn().mockReturnValue({ manager }) };
    const result = await repository.findCategoriesByTemplateIds(
      ['t1'],
      { activeOnly: true },
      context,
    );
    expect(source.getRepository).not.toHaveBeenCalled();
    expect(context.getRepository).toHaveBeenCalledWith(
      TemplateListingOrmEntity,
    );
    expect(qb.andWhere).toHaveBeenCalledWith('category.isActive = :isActive', {
      isActive: true,
    });
    expect(result.get('t1')?.every((category) => category.isActive)).toBe(true);
  });
  it('does not add an active filter for explicit false', async () => {
    await repository.findCategoriesByTemplateIds(['t1'], { activeOnly: false });
    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
