import { randomUUID } from 'crypto';

export type CreateTemplateCategoryParams = {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RestoreTemplateCategoryParams = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export class TemplateCategoryAggregate {
  private constructor(
    private readonly id: string,
    private name: string,
    private slug: string,
    private description: string | null,
    private isActive: boolean,
    private sortOrder: number,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    this.validateName(name);
    this.validateSlug(slug);
    this.validateSortOrder(sortOrder);
  }

  // =========================
  // SLUG NORMALIZATION
  // =========================

  static normalizeSlug(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // =========================
  // FACTORY
  // =========================

  static create(
    params: CreateTemplateCategoryParams,
  ): TemplateCategoryAggregate {
    const now = new Date();

    const name = params.name?.trim() ?? '';

    const rawSlug = params.slug?.trim() ? params.slug : name;

    const slug = TemplateCategoryAggregate.normalizeSlug(rawSlug);

    return new TemplateCategoryAggregate(
      params.id ?? randomUUID(),
      name,
      slug,
      params.description?.trim() || null,
      params.isActive ?? true,
      params.sortOrder ?? 0,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  // =========================
  // RESTORE FROM DATABASE
  // =========================

  static restore(
    params: RestoreTemplateCategoryParams,
  ): TemplateCategoryAggregate {
    return new TemplateCategoryAggregate(
      params.id,
      params.name,
      params.slug,
      params.description,
      params.isActive,
      params.sortOrder,
      params.createdAt,
      params.updatedAt,
    );
  }

  // =========================
  // GETTERS
  // =========================

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getDescription(): string | null {
    return this.description;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getSortOrder(): number {
    return this.sortOrder;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // =========================
  // UPDATE CATEGORY
  // =========================

  updateDetails(params: {
    name?: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
  }): void {
    const name = params.name !== undefined ? params.name.trim() : this.name;

    const slug =
      params.slug !== undefined
        ? TemplateCategoryAggregate.normalizeSlug(params.slug)
        : this.slug;

    const description =
      params.description !== undefined
        ? params.description?.trim() || null
        : this.description;

    const sortOrder =
      params.sortOrder !== undefined ? params.sortOrder : this.sortOrder;

    // Validate trước khi cập nhật state
    this.validateName(name);
    this.validateSlug(slug);
    this.validateSortOrder(sortOrder);

    this.name = name;
    this.slug = slug;
    this.description = description;
    this.sortOrder = sortOrder;
    this.updatedAt = new Date();
  }

  // =========================
  // STATUS
  // =========================

  activate(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.updatedAt = new Date();
  }

  // =========================
  // VALIDATIONS
  // =========================

  private validateName(name: string): void {
    const trimmed = name?.trim();

    if (!trimmed) {
      throw new Error('Category name is required');
    }

    if (trimmed.length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }
  }

  private validateSlug(slug: string): void {
    const trimmed = slug?.trim();

    if (!trimmed) {
      throw new Error('Category slug is required');
    }

    if (trimmed.length > 100) {
      throw new Error('Category slug cannot exceed 100 characters');
    }

    const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!kebabCaseRegex.test(trimmed)) {
      throw new Error('Category slug must be in lowercase-kebab-case format');
    }
  }

  private validateSortOrder(sortOrder: number): void {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new Error('Category sort order must be a non-negative integer');
    }
  }
}

export { TemplateCategoryAggregate as TemplateCategory };
