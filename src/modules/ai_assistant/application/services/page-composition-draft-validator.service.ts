import { BadGatewayException, Injectable } from '@nestjs/common';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { MAX_PAGE_COMPOSITION_ROWS } from '../constants/page-composition.constant';

import {
  PAGE_COMPOSITION_SCHEMA_VERSION,
  type PageCompositionDraft,
} from '../types/page-composition-draft';

@Injectable()
export class PageCompositionDraftValidator {
  validate(input: unknown): PageCompositionDraft {
    if (!this.isRecord(input)) {
      this.invalid('Draft must be an object');
    }

    if (input.schemaVersion !== PAGE_COMPOSITION_SCHEMA_VERSION) {
      this.invalid(
        `Unsupported schemaVersion. Expected ${PAGE_COMPOSITION_SCHEMA_VERSION}`,
      );
    }

    if (input.type !== 'PAGE_COMPOSITION') {
      this.invalid('Draft type must be PAGE_COMPOSITION');
    }

    if (!this.isRecord(input.page)) {
      this.invalid('Draft page must be an object');
    }

    this.validatePage(input.page);

    if (!Array.isArray(input.blocks)) {
      this.invalid('Draft blocks must be an array');
    }

    this.validateBlocks(input.blocks);

    if (!Array.isArray(input.databases)) {
      this.invalid('Draft databases must be an array');
    }

    this.validateDatabases(input.databases);

    this.validateCrossReferences(input.blocks, input.databases);

    return input as unknown as PageCompositionDraft;
  }

  private validatePage(page: Record<string, unknown>): void {
    if (typeof page.title !== 'string') {
      this.invalid('Draft page title must be a string');
    }

    if (
      page.icon !== undefined &&
      page.icon !== null &&
      typeof page.icon !== 'string'
    ) {
      this.invalid('Draft page icon must be a string or null');
    }

    if (
      page.coverUrl !== undefined &&
      page.coverUrl !== null &&
      typeof page.coverUrl !== 'string'
    ) {
      this.invalid('Draft page coverUrl must be a string or null');
    }
  }

  private validateBlocks(blocks: unknown[]): void {
    const blockByRef = new Map<string, Record<string, unknown>>();

    for (const [index, value] of blocks.entries()) {
      if (!this.isRecord(value)) {
        this.invalid(`Draft block at index ${index} must be an object`);
      }

      this.validateBlock(value, index);

      const ref = (value.ref as string).trim();

      if (blockByRef.has(ref)) {
        this.invalid(`Duplicate block ref: ${ref}`);
      }

      blockByRef.set(ref, value);
    }

    for (const block of blockByRef.values()) {
      if (block.parentRef === undefined || block.parentRef === null) {
        continue;
      }

      const parentRef = (block.parentRef as string).trim();

      const blockRef = (block.ref as string).trim();

      if (parentRef === blockRef) {
        this.invalid(`Block ${block.ref} cannot reference itself as parent`);
      }

      const parent = blockByRef.get(parentRef);

      if (!parent) {
        this.invalid(
          `Block ${block.ref} references unknown parentRef: ${parentRef}`,
        );
      }

      if (parent.type !== PageBlockType.TOGGLE) {
        this.invalid(
          `Block ${block.ref} parent ${parentRef} must be a TOGGLE block`,
        );
      }
    }

    this.validateBlockParentCycles(blockByRef);
  }

  private validateBlockParentCycles(
    blockByRef: Map<string, Record<string, unknown>>,
  ): void {
    for (const startRef of blockByRef.keys()) {
      const visited = new Set<string>();

      let currentRef: string | null = startRef;

      while (currentRef !== null) {
        if (visited.has(currentRef)) {
          this.invalid(`Block parent cycle detected involving ${currentRef}`);
        }

        visited.add(currentRef);

        const currentBlock = blockByRef.get(currentRef);

        if (!currentBlock) {
          break;
        }

        if (
          currentBlock.parentRef === undefined ||
          currentBlock.parentRef === null
        ) {
          break;
        }

        currentRef = (currentBlock.parentRef as string).trim();
      }
    }
  }

  private validateBlock(block: Record<string, unknown>, index: number): void {
    if (typeof block.ref !== 'string' || !block.ref.trim()) {
      this.invalid(`Draft block at index ${index} must have a non-empty ref`);
    }

    if (
      block.parentRef !== undefined &&
      block.parentRef !== null &&
      (typeof block.parentRef !== 'string' || !block.parentRef.trim())
    ) {
      this.invalid(`Block ${block.ref} parentRef must be a string or null`);
    }

    if (
      block.orderIndex !== undefined &&
      (!Number.isInteger(block.orderIndex) || (block.orderIndex as number) < 0)
    ) {
      this.invalid(
        `Block ${block.ref} orderIndex must be a non-negative integer`,
      );
    }

    switch (block.type) {
      case PageBlockType.TEXT:
      case PageBlockType.QUOTE:
      case PageBlockType.TOGGLE:
        this.validateTextContent(block);
        return;

      case PageBlockType.HEADER:
        this.validateTextContent(block);
        this.validateHeaderStyle(block);
        return;

      case PageBlockType.TODO:
        this.validateTodoContent(block);
        return;

      case PageBlockType.DATABASE_VIEW:
        this.validateDatabaseViewBlock(block);
        return;

      default:
        this.invalid(
          `Block ${block.ref} has unsupported type: ${String(block.type)}`,
        );
    }
  }

  private validateTextContent(block: Record<string, unknown>): void {
    if (!this.isRecord(block.content)) {
      this.invalid(`Block ${block.ref} content must be an object`);
    }

    if (typeof block.content.text !== 'string') {
      this.invalid(`Block ${block.ref} content.text must be a string`);
    }
  }

  private validateTodoContent(block: Record<string, unknown>): void {
    if (!this.isRecord(block.content)) {
      this.invalid(`Block ${block.ref} content must be an object`);
    }

    if (typeof block.content.text !== 'string') {
      this.invalid(`Block ${block.ref} content.text must be a string`);
    }

    if (typeof block.content.checked !== 'boolean') {
      this.invalid(`Block ${block.ref} content.checked must be a boolean`);
    }
  }

  private validateHeaderStyle(block: Record<string, unknown>): void {
    if (block.styleConfig === undefined) {
      return;
    }

    if (!this.isRecord(block.styleConfig)) {
      this.invalid(`Block ${block.ref} styleConfig must be an object`);
    }

    if (!Number.isInteger(block.styleConfig.level)) {
      this.invalid(`Block ${block.ref} styleConfig.level must be an integer`);
    }
  }

  private validateDatabaseViewBlock(block: Record<string, unknown>): void {
    if (typeof block.databaseRef !== 'string' || !block.databaseRef.trim()) {
      this.invalid(`Block ${block.ref} databaseRef must be a non-empty string`);
    }

    if (typeof block.viewRef !== 'string' || !block.viewRef.trim()) {
      this.invalid(`Block ${block.ref} viewRef must be a non-empty string`);
    }
  }

  private validateDatabases(databases: unknown[]): void {
    if (databases.length > 1) {
      this.invalid('MVP supports at most one database per page composition');
    }

    const databaseRefs = new Set<string>();

    for (const [index, value] of databases.entries()) {
      if (!this.isRecord(value)) {
        this.invalid(`Draft database at index ${index} must be an object`);
      }

      this.validateDatabase(value, index);

      const ref = (value.ref as string).trim();

      if (databaseRefs.has(ref)) {
        this.invalid(`Duplicate database ref: ${ref}`);
      }

      databaseRefs.add(ref);
    }
  }

  private validateDatabase(
    database: Record<string, unknown>,
    index: number,
  ): void {
    if (typeof database.ref !== 'string' || !database.ref.trim()) {
      this.invalid(
        `Draft database at index ${index} must have a non-empty ref`,
      );
    }

    if (typeof database.name !== 'string' || !database.name.trim()) {
      this.invalid(`Database ${database.ref} name must be non-empty`);
    }

    if (!Array.isArray(database.properties)) {
      this.invalid(`Database ${database.ref} properties must be an array`);
    }

    this.validateDatabaseProperties(
      database.ref as string,
      database.properties,
    );

    if (!Array.isArray(database.views)) {
      this.invalid(`Database ${database.ref} views must be an array`);
    }

    this.validateDatabaseViews(database.ref as string, database.views);

    if (!Array.isArray(database.rows)) {
      this.invalid(`Database ${database.ref} rows must be an array`);
    }

    this.validateDatabaseRows(
      database.ref as string,
      database.properties,
      database.rows,
    );
  }

  private validateDatabaseProperties(
    databaseRef: string,
    properties: unknown[],
  ): void {
    const propertyRefs = new Set<string>();
    const propertyNames = new Set<string>();

    let titleProperty: Record<string, unknown> | undefined;

    for (const [index, value] of properties.entries()) {
      if (!this.isRecord(value)) {
        this.invalid(
          `Property at index ${index} in database ${databaseRef} must be an object`,
        );
      }

      this.validateDatabaseProperty(databaseRef, value, index);

      const ref = (value.ref as string).trim();

      const normalizedName = (value.name as string).trim().toLowerCase();

      if (propertyRefs.has(ref)) {
        this.invalid(
          `Duplicate property ref ${ref} in database ${databaseRef}`,
        );
      }

      if (propertyNames.has(normalizedName)) {
        this.invalid(
          `Duplicate property name ${value.name} in database ${databaseRef}`,
        );
      }

      propertyRefs.add(ref);
      propertyNames.add(normalizedName);

      if (value.type === PropertyType.TITLE) {
        if (titleProperty) {
          this.invalid(
            `Database ${databaseRef} can contain at most one TITLE property`,
          );
        }

        titleProperty = value;
      }
    }

    const effectiveTitleName = titleProperty
      ? (titleProperty.name as string).trim().toLowerCase()
      : 'name';

    const defaultPropertyNames = [effectiveTitleName, 'assignee', 'due date'];

    if (
      effectiveTitleName === 'assignee' ||
      effectiveTitleName === 'due date'
    ) {
      this.invalid(
        `TITLE property in database ${databaseRef} conflicts with a default property`,
      );
    }

    for (const value of properties) {
      const property = value as Record<string, unknown>;

      if (property.type === PropertyType.TITLE) {
        continue;
      }

      const normalizedName = (property.name as string).trim().toLowerCase();

      if (defaultPropertyNames.includes(normalizedName)) {
        this.invalid(
          `Property ${property.name} in database ${databaseRef} conflicts with a default property`,
        );
      }
    }
  }

  private validateDatabaseProperty(
    databaseRef: string,
    property: Record<string, unknown>,
    index: number,
  ): void {
    if (typeof property.ref !== 'string' || !property.ref.trim()) {
      this.invalid(
        `Property at index ${index} in database ${databaseRef} must have a non-empty ref`,
      );
    }

    if (typeof property.name !== 'string' || !property.name.trim()) {
      this.invalid(
        `Property ${property.ref} in database ${databaseRef} must have a non-empty name`,
      );
    }

    if ((property.name as string).trim().length > 255) {
      this.invalid(
        `Property ${property.ref} name must not exceed 255 characters`,
      );
    }

    switch (property.type) {
      case PropertyType.TITLE:
      case PropertyType.TEXT:
      case PropertyType.NUMBER:
      case PropertyType.CHECKBOX:
      case PropertyType.DATE:
        return;

      case PropertyType.SELECT:
        this.validateSelectProperty(databaseRef, property);
        return;

      default:
        this.invalid(
          `Property ${property.ref} in database ${databaseRef} has unsupported type: ${String(property.type)}`,
        );
    }
  }

  private validateSelectProperty(
    databaseRef: string,
    property: Record<string, unknown>,
  ): void {
    if (!Array.isArray(property.options)) {
      this.invalid(
        `SELECT property ${property.ref} in database ${databaseRef} must have an options array`,
      );
    }

    const optionRefs = new Set<string>();
    const optionNames = new Set<string>();

    for (const [index, value] of property.options.entries()) {
      if (!this.isRecord(value)) {
        this.invalid(
          `Option at index ${index} of property ${property.ref} must be an object`,
        );
      }

      if (typeof value.ref !== 'string' || !value.ref.trim()) {
        this.invalid(
          `Option at index ${index} of property ${property.ref} must have a non-empty ref`,
        );
      }

      if (typeof value.name !== 'string' || !value.name.trim()) {
        this.invalid(
          `Option ${value.ref} of property ${property.ref} must have a non-empty name`,
        );
      }

      if (
        value.color !== undefined &&
        value.color !== null &&
        typeof value.color !== 'string'
      ) {
        this.invalid(`Option ${value.ref} color must be a string or null`);
      }

      const ref = value.ref.trim();

      const normalizedName = value.name.trim().toLowerCase();

      if (optionRefs.has(ref)) {
        this.invalid(`Duplicate option ref ${ref} in property ${property.ref}`);
      }

      if (optionNames.has(normalizedName)) {
        this.invalid(
          `Duplicate option name ${value.name} in property ${property.ref}`,
        );
      }

      optionRefs.add(ref);
      optionNames.add(normalizedName);
    }
  }

  private validateDatabaseViews(databaseRef: string, views: unknown[]): void {
    if (views.length > 1) {
      this.invalid(`Database ${databaseRef} supports at most one view in MVP`);
    }

    const viewRefs = new Set<string>();

    for (const [index, value] of views.entries()) {
      if (!this.isRecord(value)) {
        this.invalid(
          `View at index ${index} in database ${databaseRef} must be an object`,
        );
      }

      if (typeof value.ref !== 'string' || !value.ref.trim()) {
        this.invalid(
          `View at index ${index} in database ${databaseRef} must have a non-empty ref`,
        );
      }

      if (typeof value.name !== 'string' || !value.name.trim()) {
        this.invalid(
          `View ${value.ref} in database ${databaseRef} must have a non-empty name`,
        );
      }

      if (value.type !== DatabaseViewType.TABLE) {
        this.invalid(
          `View ${value.ref} in database ${databaseRef} must use TABLE type in MVP`,
        );
      }

      const ref = value.ref.trim();

      if (viewRefs.has(ref)) {
        this.invalid(`Duplicate view ref ${ref} in database ${databaseRef}`);
      }

      viewRefs.add(ref);
    }
  }

  private validateDatabaseRows(
    databaseRef: string,
    properties: unknown[],
    rows: unknown[],
  ): void {
    if (rows.length > MAX_PAGE_COMPOSITION_ROWS) {
      this.invalid(
        `Database ${databaseRef} exceeds the maximum of ${MAX_PAGE_COMPOSITION_ROWS} rows for page composition`,
      );
    }
    const propertyByRef = new Map<string, Record<string, unknown>>();

    for (const value of properties) {
      const property = value as Record<string, unknown>;

      propertyByRef.set((property.ref as string).trim(), property);
    }

    const rowRefs = new Set<string>();

    for (const [index, value] of rows.entries()) {
      if (!this.isRecord(value)) {
        this.invalid(
          `Row at index ${index} in database ${databaseRef} must be an object`,
        );
      }

      if (value.ref !== undefined) {
        if (typeof value.ref !== 'string' || !value.ref.trim()) {
          this.invalid(
            `Row at index ${index} in database ${databaseRef} ref must be a non-empty string`,
          );
        }

        const ref = value.ref.trim();

        if (rowRefs.has(ref)) {
          this.invalid(`Duplicate row ref ${ref} in database ${databaseRef}`);
        }

        rowRefs.add(ref);
      }

      if (!this.isRecord(value.values)) {
        this.invalid(
          `Row ${value.ref ?? index} in database ${databaseRef} values must be an object`,
        );
      }

      for (const [propertyRef, rowValue] of Object.entries(value.values)) {
        const property = propertyByRef.get(propertyRef.trim());

        if (!property) {
          this.invalid(
            `Row ${value.ref ?? index} in database ${databaseRef} references unknown property ${propertyRef}`,
          );
        }

        this.validateRowValue(
          databaseRef,
          value.ref ?? index,
          property,
          rowValue,
        );
      }
    }
  }

  private validateRowValue(
    databaseRef: string,
    rowRef: unknown,
    property: Record<string, unknown>,
    value: unknown,
  ): void {
    if (value === null) {
      return;
    }

    switch (property.type) {
      case PropertyType.TITLE:
      case PropertyType.TEXT:
        if (typeof value !== 'string') {
          this.invalid(
            `Row ${String(rowRef)} property ${property.ref} in database ${databaseRef} requires a string value`,
          );
        }

        return;

      case PropertyType.NUMBER:
        if (typeof value !== 'number') {
          this.invalid(
            `Row ${String(rowRef)} property ${property.ref} in database ${databaseRef} requires a number value`,
          );
        }

        return;

      case PropertyType.CHECKBOX:
        if (typeof value !== 'boolean') {
          this.invalid(
            `Row ${String(rowRef)} property ${property.ref} in database ${databaseRef} requires a boolean value`,
          );
        }

        return;

      case PropertyType.DATE:
        this.validateDateRowValue(databaseRef, rowRef, property, value);
        return;

      case PropertyType.SELECT:
        this.validateSelectRowValue(databaseRef, rowRef, property, value);
        return;

      default:
        this.invalid(
          `Row ${String(rowRef)} property ${property.ref} in database ${databaseRef} uses unsupported property type ${String(property.type)}`,
        );
    }
  }

  private validateDateRowValue(
    databaseRef: string,
    rowRef: unknown,
    property: Record<string, unknown>,
    value: unknown,
  ): void {
    if (!this.isRecord(value)) {
      this.invalid(
        `Row ${String(rowRef)} property ${property.ref} in database ${databaseRef} requires a date object`,
      );
    }

    if (typeof value.start !== 'string') {
      this.invalid(
        `Row ${String(rowRef)} property ${property.ref} date.start must be a string`,
      );
    }

    if (
      value.end !== undefined &&
      value.end !== null &&
      typeof value.end !== 'string'
    ) {
      this.invalid(
        `Row ${String(rowRef)} property ${property.ref} date.end must be a string or null`,
      );
    }
  }

  private validateSelectRowValue(
    databaseRef: string,
    rowRef: unknown,
    property: Record<string, unknown>,
    value: unknown,
  ): void {
    if (!this.isRecord(value)) {
      this.invalid(
        `Row ${String(rowRef)} property ${property.ref} in database ${databaseRef} requires a SELECT value object`,
      );
    }

    if (typeof value.optionRef !== 'string' || !value.optionRef.trim()) {
      this.invalid(
        `Row ${String(rowRef)} property ${property.ref} requires a non-empty optionRef`,
      );
    }

    if (!Array.isArray(property.options)) {
      this.invalid(`SELECT property ${property.ref} options must be an array`);
    }

    const optionRef = value.optionRef.trim();

    const optionExists = property.options.some(
      (option) =>
        this.isRecord(option) &&
        typeof option.ref === 'string' &&
        option.ref.trim() === optionRef,
    );

    if (!optionExists) {
      this.invalid(
        `Row ${String(rowRef)} property ${property.ref} references unknown optionRef ${optionRef}`,
      );
    }
  }

  private validateCrossReferences(
    blocks: unknown[],
    databases: unknown[],
  ): void {
    const databaseByRef = new Map<string, Record<string, unknown>>();

    for (const value of databases) {
      const database = value as Record<string, unknown>;

      databaseByRef.set((database.ref as string).trim(), database);
    }

    for (const value of blocks) {
      const block = value as Record<string, unknown>;

      if (block.type !== PageBlockType.DATABASE_VIEW) {
        continue;
      }

      const databaseRef = (block.databaseRef as string).trim();

      const viewRef = (block.viewRef as string).trim();

      const database = databaseByRef.get(databaseRef);

      if (!database) {
        this.invalid(
          `Block ${block.ref} references unknown databaseRef ${databaseRef}`,
        );
      }

      const views = database.views as unknown[];

      const viewExists = views.some(
        (view) =>
          this.isRecord(view) &&
          typeof view.ref === 'string' &&
          view.ref.trim() === viewRef,
      );

      if (!viewExists) {
        this.invalid(
          `Block ${block.ref} references unknown viewRef ${viewRef} in database ${databaseRef}`,
        );
      }
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private invalid(message: string): never {
    throw new BadGatewayException(
      `AI returned an invalid page composition draft: ${message}`,
    );
  }
}
