import { PropertyType } from '../../enums/property-type.enum';
import { DatabaseProperty } from './database-property.entity';

interface CreateDatabaseParams {
  id: string;
  pageId: string;
  name: string;
  titlePropertyId: string;
}

interface RestoreDatabaseParams {
  id: string;
  pageId: string;
  name: string;
  properties: DatabaseProperty[];
}

export class Database {
  private properties: DatabaseProperty[];

  private constructor(
    readonly id: string,
    readonly pageId: string,
    private name: string,
    properties: DatabaseProperty[],
  ) {
    this.validateName(name);

    this.name = name.trim();
    this.properties = properties;

    this.validateTitleProperties();
  }

  static create(params: CreateDatabaseParams): Database {
    const database = new Database(params.id, params.pageId, params.name, []);

    const titleProperty = new DatabaseProperty(
      params.titlePropertyId,
      params.id,
      'Name',
      PropertyType.TITLE,
      '0',
    );

    database.addProperty(titleProperty);

    return database;
  }

  static restore(params: RestoreDatabaseParams): Database {
    return new Database(
      params.id,
      params.pageId,
      params.name,
      params.properties,
    );
  }

  getId(): string {
    return this.id;
  }

  getPageId(): string {
    return this.pageId;
  }

  getName(): string {
    return this.name;
  }

  getProperties(): readonly DatabaseProperty[] {
    return this.properties;
  }

  rename(name: string): void {
    this.validateName(name);

    this.name = name.trim();
  }

  addProperty(property: DatabaseProperty): void {
    if (property.getDatabaseId() !== this.id) {
      throw new Error('Property does not belong to this database');
    }

    const duplicateName = this.properties.some(
      (item) =>
        item.getName().toLowerCase() === property.getName().toLowerCase(),
    );

    if (duplicateName) {
      throw new Error('Property name already exists');
    }

    if (property.getType() === PropertyType.TITLE) {
      const titleExists = this.properties.some(
        (item) => item.getType() === PropertyType.TITLE,
      );

      if (titleExists) {
        throw new Error('Database can only contain one TITLE property');
      }
    }

    this.properties.push(property);
  }

  private validateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Database name is required');
    }
  }

  private validateTitleProperties(): void {
    const titleProperties = this.properties.filter(
      (property) => property.getType() === PropertyType.TITLE,
    );

    if (titleProperties.length > 1) {
      throw new Error('Database can only contain one TITLE property');
    }
  }
}
