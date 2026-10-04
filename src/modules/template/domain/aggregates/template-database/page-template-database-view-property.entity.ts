import { randomUUID } from 'crypto';

export type CreatePageTemplateDatabaseViewPropertyParams = {
  id?: string;
  templateViewId: string;
  templatePropertyId: string;
  position: string;
  visible?: boolean;
  width?: number | null;
};

export type RestorePageTemplateDatabaseViewPropertyParams = {
  id: string;
  templateViewId: string;
  templatePropertyId: string;
  position: string;
  visible: boolean;
  width: number | null;
};

export class PageTemplateDatabaseViewProperty {
  private constructor(
    private readonly id: string,
    private readonly templateViewId: string,
    private readonly templatePropertyId: string,
    private position: string,
    private visible: boolean,
    private width: number | null,
  ) {
    this.validatePosition(position);

    this.position = position.trim();
  }

  static create(
    params: CreatePageTemplateDatabaseViewPropertyParams,
  ): PageTemplateDatabaseViewProperty {
    return new PageTemplateDatabaseViewProperty(
      params.id ?? randomUUID(),
      params.templateViewId,
      params.templatePropertyId,
      params.position,
      params.visible ?? true,
      params.width ?? null,
    );
  }

  static restore(
    params: RestorePageTemplateDatabaseViewPropertyParams,
  ): PageTemplateDatabaseViewProperty {
    return new PageTemplateDatabaseViewProperty(
      params.id,
      params.templateViewId,
      params.templatePropertyId,
      params.position,
      params.visible,
      params.width,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateViewId(): string {
    return this.templateViewId;
  }

  getTemplatePropertyId(): string {
    return this.templatePropertyId;
  }

  getPosition(): string {
    return this.position;
  }

  getVisible(): boolean {
    return this.visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getWidth(): number | null {
    return this.width;
  }

  private validatePosition(position: string): void {
    if (!position.trim()) {
      throw new Error('Database view property position is required');
    }
  }
}
