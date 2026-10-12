import { TemplateCategory } from './template-category.aggregate';

describe('TemplateCategoryAggregate', () => {
  it('should create a valid category aggregate and normalize slug', () => {
    const category = TemplateCategory.create({
      name: 'Project Management',
      description: 'Tools for projects',
      sortOrder: 1,
    });

    expect(category.getId()).toBeDefined();
    expect(category.getName()).toBe('Project Management');
    expect(category.getSlug()).toBe('project-management');
    expect(category.getDescription()).toBe('Tools for projects');
    expect(category.getIsActive()).toBe(true);
    expect(category.getSortOrder()).toBe(1);
    expect(category.getCreatedAt()).toBeInstanceOf(Date);
    expect(category.getUpdatedAt()).toBeInstanceOf(Date);
  });

  it('should normalize custom slug with uppercase and special chars', () => {
    const category = TemplateCategory.create({
      name: 'Software Engineering',
      slug: 'Software_Engineering & Architecture!',
    });

    expect(category.getSlug()).toBe('software-engineering-architecture');
  });

  it('should throw an error if name is empty', () => {
    expect(() =>
      TemplateCategory.create({
        name: '   ',
      }),
    ).toThrow('Category name is required');
  });

  it('should throw an error if sort order is negative or not an integer', () => {
    expect(() =>
      TemplateCategory.create({
        name: 'Design',
        sortOrder: -1,
      }),
    ).toThrow('Category sort order must be a non-negative integer');

    expect(() =>
      TemplateCategory.create({
        name: 'Design',
        sortOrder: 1.5,
      }),
    ).toThrow('Category sort order must be a non-negative integer');
  });

  it('should restore a category aggregate', () => {
    const now = new Date();
    const category = TemplateCategory.restore({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Productivity',
      slug: 'productivity',
      description: null,
      isActive: false,
      sortOrder: 5,
      createdAt: now,
      updatedAt: now,
    });

    expect(category.getId()).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(category.getIsActive()).toBe(false);
    expect(category.getSortOrder()).toBe(5);
  });

  it('should update details and deactivate/activate', () => {
    const category = TemplateCategory.create({
      name: 'Old Name',
      sortOrder: 0,
    });

    category.updateDetails({
      name: 'New Name',
      slug: 'new-name',
      sortOrder: 2,
    });

    expect(category.getName()).toBe('New Name');
    expect(category.getSlug()).toBe('new-name');
    expect(category.getSortOrder()).toBe(2);

    category.deactivate();
    expect(category.getIsActive()).toBe(false);

    category.activate();
    expect(category.getIsActive()).toBe(true);
  });
});
