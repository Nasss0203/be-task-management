import { randomUUID } from 'crypto';

export type CreatePageTemplateDatabasePropertyOptionParams = {
  id?: string;
  templatePropertyId: string;
  name: string;
  color?: string | null;
  position: string;
};

export type RestorePageTemplateDatabasePropertyOptionParams = {
  id: string;
  templatePropertyId: string;
  name: string;
  color: string | null;
  position: string;
};

export class PageTemplateDatabasePropertyOption {
  private constructor(
    private readonly id: string,
    private readonly templatePropertyId: string,
    private name: string,
    private color: string | null,
    private position: string,
  ) {
    this.validateName(name);

    this.name = name.trim();
    this.position = position.trim();
  }

  static create(
    params: CreatePageTemplateDatabasePropertyOptionParams,
  ): PageTemplateDatabasePropertyOption {
    return new PageTemplateDatabasePropertyOption(
      params.id ?? randomUUID(),
      params.templatePropertyId,
      params.name,
      params.color ?? null,
      params.position,
    );
  }

  static restore(
    params: RestorePageTemplateDatabasePropertyOptionParams,
  ): PageTemplateDatabasePropertyOption {
    return new PageTemplateDatabasePropertyOption(
      params.id,
      params.templatePropertyId,
      params.name,
      params.color,
      params.position,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplatePropertyId(): string {
    return this.templatePropertyId;
  }

  getName(): string {
    return this.name;
  }

  getColor(): string | null {
    return this.color;
  }

  getPosition(): string {
    return this.position;
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Property option name is required');
    }
  }
}
