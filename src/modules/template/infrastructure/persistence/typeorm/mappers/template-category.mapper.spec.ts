import { TemplateCategory } from '../../../../domain/aggregates/template-category/template-category.aggregate';
import { TemplateCategoryOrmEntity } from '../entities/template-category.orm-entity';
import { TemplateCategoryMapper } from './template-category.mapper';

describe('TemplateCategoryMapper', () => {
  it('should map domain aggregate to ORM entity correctly', () => {
    const category = TemplateCategory.create({
      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      name: 'Project Management',
      slug: 'project-management',
      description: 'Project tools and templates',
      isActive: true,
      sortOrder: 1,
    });

    const orm = TemplateCategoryMapper.toOrm(category);

    expect(orm.id).toBe(category.getId());
    expect(orm.name).toBe('Project Management');
    expect(orm.slug).toBe('project-management');
    expect(orm.description).toBe('Project tools and templates');
    expect(orm.isActive).toBe(true);
    expect(orm.sortOrder).toBe(1);
    expect(orm.createdAt).toEqual(category.getCreatedAt());
    expect(orm.updatedAt).toEqual(category.getUpdatedAt());
  });

  it('should map ORM entity to domain aggregate correctly', () => {
    const now = new Date();
    const orm = new TemplateCategoryOrmEntity();
    orm.id = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
    orm.name = 'Engineering';
    orm.slug = 'engineering';
    orm.description = null;
    orm.isActive = false;
    orm.sortOrder = 10;
    orm.createdAt = now;
    orm.updatedAt = now;

    const domain = TemplateCategoryMapper.toDomain(orm);

    expect(domain.getId()).toBe(orm.id);
    expect(domain.getName()).toBe('Engineering');
    expect(domain.getSlug()).toBe('engineering');
    expect(domain.getDescription()).toBeNull();
    expect(domain.getIsActive()).toBe(false);
    expect(domain.getSortOrder()).toBe(10);
    expect(domain.getCreatedAt()).toEqual(now);
    expect(domain.getUpdatedAt()).toEqual(now);
  });
});
