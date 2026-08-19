import { DatabaseViewType } from '../../enums/database-view-type.enum';
import { DatabaseViewProperty } from './database-view-property.entity';

interface CreateDatabaseViewProps {
  id: string;
  databaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
}

interface RestoreDatabaseViewProps {
  id: string;
  databaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties?: DatabaseViewProperty[];
}

interface AddDatabaseViewPropertyProps {
  id: string;
  propertyId: string;
  position: string;
  visible?: boolean;
  width?: number | null;
}

export class DatabaseView {
  private constructor(
    private readonly id: string,
    private readonly databaseId: string,
    private name: string,
    private readonly type: DatabaseViewType,
    private position: string,
    private readonly properties: DatabaseViewProperty[],
  ) {}

  static create(props: CreateDatabaseViewProps): DatabaseView {
    const name = props.name.trim();

    if (!name) {
      throw new Error('Database view name is required');
    }

    return new DatabaseView(
      props.id,
      props.databaseId,
      name,
      props.type,
      props.position,
      [],
    );
  }

  static restore(props: RestoreDatabaseViewProps): DatabaseView {
    return new DatabaseView(
      props.id,
      props.databaseId,
      props.name,
      props.type,
      props.position,
      props.properties ?? [],
    );
  }

  getId(): string {
    return this.id;
  }

  getDatabaseId(): string {
    return this.databaseId;
  }

  getName(): string {
    return this.name;
  }

  getType(): DatabaseViewType {
    return this.type;
  }

  getPosition(): string {
    return this.position;
  }

  getProperties(): readonly DatabaseViewProperty[] {
    return this.properties;
  }

  rename(name: string): void {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error('Database view name is required');
    }

    this.name = normalizedName;
  }

  changePosition(position: string): void {
    if (!position.trim()) {
      throw new Error('Database view position is required');
    }

    this.position = position.trim();
  }

  addProperty(props: AddDatabaseViewPropertyProps): DatabaseViewProperty {
    const existingProperty = this.properties.find(
      (item) => item.getPropertyId() === props.propertyId,
    );

    if (existingProperty) {
      throw new Error('Database property already exists in this view');
    }

    const viewProperty = DatabaseViewProperty.create({
      id: props.id,
      viewId: this.id,
      propertyId: props.propertyId,
      position: props.position,
      visible: props.visible,
      width: props.width,
    });

    this.properties.push(viewProperty);

    return viewProperty;
  }
}
