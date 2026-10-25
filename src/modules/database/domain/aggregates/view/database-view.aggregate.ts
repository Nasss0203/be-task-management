import {
  MAX_DATABASE_VIEW_FILTERS,
  VALUELESS_OPERATORS,
  type DatabaseViewFilter,
} from '../../constants/database-view-filter.constant';
import { DatabaseViewType } from '../../enums/database-view-type.enum';
import { DatabaseViewPropertyNotFoundException } from '../../exceptions/database-view-property-not-found.exception';
import { InvalidDatabaseViewFilterException } from '../../exceptions/invalid-database-view-filter.exception';
import { InvalidDatabaseViewSortException } from '../../exceptions/invalid-database-view-sort.exception';
import { DatabaseViewProperty } from './database-view-property.entity';

export const MAX_DATABASE_VIEW_SORTS = 5;

export type DatabaseViewSortDirection = 'asc' | 'desc';

export interface DatabaseViewSort {
  propertyId: string;
  direction: DatabaseViewSortDirection;
}

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
  sorts?: DatabaseViewSort[];
  filters?: DatabaseViewFilter[];
  groupBy?: string | null;
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
    private sorts: DatabaseViewSort[],
    private filters: DatabaseViewFilter[],
    private groupBy: string | null,
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
      [],
      [],
      null,
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
      props.sorts ?? [],
      props.filters ?? [],
      props.groupBy ?? null,
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

  getSorts(): readonly DatabaseViewSort[] {
    return this.sorts;
  }

  setSorts(sorts: readonly DatabaseViewSort[]): void {
    if (sorts.length > MAX_DATABASE_VIEW_SORTS) {
      throw new InvalidDatabaseViewSortException(
        `A view can have at most ${MAX_DATABASE_VIEW_SORTS} sorts`,
      );
    }

    const propertyIds = new Set<string>();

    for (const sort of sorts) {
      if (sort.direction !== 'asc' && sort.direction !== 'desc') {
        throw new InvalidDatabaseViewSortException(
          'Sort direction must be asc or desc',
        );
      }

      if (propertyIds.has(sort.propertyId)) {
        throw new InvalidDatabaseViewSortException(
          'A property can only be sorted once per view',
        );
      }

      propertyIds.add(sort.propertyId);
    }

    this.sorts = sorts.map(({ propertyId, direction }) => ({
      propertyId,
      direction,
    }));
  }

  getFilters(): readonly DatabaseViewFilter[] {
    return this.filters;
  }

  getGroupBy(): string | null {
    return this.groupBy;
  }

  setGroupBy(propertyId: string | null): void {
    this.groupBy = propertyId;
  }

  setFilters(filters: readonly DatabaseViewFilter[]): void {
    if (filters.length > MAX_DATABASE_VIEW_FILTERS) {
      throw new InvalidDatabaseViewFilterException(
        `A view can have at most ${MAX_DATABASE_VIEW_FILTERS} filters`,
      );
    }

    this.filters = filters.map(({ propertyId, operator, value }) => ({
      propertyId,
      operator,
      value: VALUELESS_OPERATORS.has(operator) ? null : (value ?? null),
    }));
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

  setPropertyVisibility(propertyId: string, visible: boolean): void {
    const property = this.properties.find(
      (item) => item.getPropertyId() === propertyId,
    );

    if (!property) {
      throw new DatabaseViewPropertyNotFoundException();
    }

    property.setVisible(visible);
  }

  setPropertyWidth(propertyId: string, width: number | null): void {
    const property = this.properties.find(
      (item) => item.getPropertyId() === propertyId,
    );

    if (!property) {
      throw new DatabaseViewPropertyNotFoundException();
    }

    property.changeWidth(width);
  }
}
