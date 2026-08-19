interface CreateDatabaseViewPropertyProps {
  id: string;
  viewId: string;
  propertyId: string;
  position: string;
  visible?: boolean;
  width?: number | null;
}

interface RestoreDatabaseViewPropertyProps {
  id: string;
  viewId: string;
  propertyId: string;
  position: string;
  visible: boolean;
  width: number | null;
}

export class DatabaseViewProperty {
  private constructor(
    private readonly id: string,
    private readonly viewId: string,
    private readonly propertyId: string,
    private position: string,
    private visible: boolean,
    private width: number | null,
  ) {}

  static create(props: CreateDatabaseViewPropertyProps): DatabaseViewProperty {
    return new DatabaseViewProperty(
      props.id,
      props.viewId,
      props.propertyId,
      props.position,
      props.visible ?? true,
      props.width ?? null,
    );
  }

  static restore(
    props: RestoreDatabaseViewPropertyProps,
  ): DatabaseViewProperty {
    return new DatabaseViewProperty(
      props.id,
      props.viewId,
      props.propertyId,
      props.position,
      props.visible,
      props.width,
    );
  }

  getId(): string {
    return this.id;
  }

  getViewId(): string {
    return this.viewId;
  }

  getPropertyId(): string {
    return this.propertyId;
  }

  getPosition(): string {
    return this.position;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getWidth(): number | null {
    return this.width;
  }

  changePosition(position: string): void {
    if (!position.trim()) {
      throw new Error('Database view property position is required');
    }

    this.position = position.trim();
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  changeWidth(width: number | null): void {
    this.width = width;
  }
}
