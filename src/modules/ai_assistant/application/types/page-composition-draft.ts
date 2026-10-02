import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

export const PAGE_COMPOSITION_SCHEMA_VERSION = 1 as const;

export type PageCompositionType = 'PAGE_COMPOSITION';

export type PageCompositionBlockType =
  | PageBlockType.HEADER
  | PageBlockType.TEXT
  | PageBlockType.QUOTE
  | PageBlockType.TODO
  | PageBlockType.TOGGLE
  | PageBlockType.DATABASE_VIEW;

export type PageCompositionPropertyType =
  | PropertyType.TITLE
  | PropertyType.TEXT
  | PropertyType.NUMBER
  | PropertyType.SELECT
  | PropertyType.CHECKBOX
  | PropertyType.DATE;

export type PageCompositionViewType = DatabaseViewType.TABLE;

export interface PageCompositionDraft {
  schemaVersion: typeof PAGE_COMPOSITION_SCHEMA_VERSION;
  type: PageCompositionType;

  page: PageCompositionPageDraft;

  blocks: PageCompositionBlockDraft[];

  databases: PageCompositionDatabaseDraft[];
}

export interface PageCompositionPageDraft {
  title: string;
  icon?: string | null;
  coverUrl?: string | null;
}

export type PageCompositionBlockDraft =
  | PageCompositionTextBlockDraft
  | PageCompositionHeaderBlockDraft
  | PageCompositionQuoteBlockDraft
  | PageCompositionTodoBlockDraft
  | PageCompositionToggleBlockDraft
  | PageCompositionDatabaseViewBlockDraft;

interface PageCompositionBlockBase {
  ref: string;
  parentRef?: string | null;
  orderIndex?: number;
}

export interface PageCompositionTextBlockDraft extends PageCompositionBlockBase {
  type: PageBlockType.TEXT;
  content: {
    text: string;
  };
}

export interface PageCompositionHeaderBlockDraft extends PageCompositionBlockBase {
  type: PageBlockType.HEADER;
  content: {
    text: string;
  };
  styleConfig?: {
    level: number;
  };
}

export interface PageCompositionQuoteBlockDraft extends PageCompositionBlockBase {
  type: PageBlockType.QUOTE;
  content: {
    text: string;
  };
}

export interface PageCompositionTodoBlockDraft extends PageCompositionBlockBase {
  type: PageBlockType.TODO;
  content: {
    text: string;
    checked: boolean;
  };
}

export interface PageCompositionToggleBlockDraft extends PageCompositionBlockBase {
  type: PageBlockType.TOGGLE;
  content: {
    text: string;
  };
}

export interface PageCompositionDatabaseViewBlockDraft extends PageCompositionBlockBase {
  type: PageBlockType.DATABASE_VIEW;

  databaseRef: string;
  viewRef: string;
}

export interface PageCompositionDatabaseDraft {
  ref: string;
  name: string;

  properties: PageCompositionPropertyDraft[];

  views: PageCompositionViewDraft[];

  rows: PageCompositionRowDraft[];
}

export type PageCompositionPropertyDraft =
  | PageCompositionSimplePropertyDraft
  | PageCompositionSelectPropertyDraft;

export interface PageCompositionSimplePropertyDraft {
  ref: string;
  name: string;

  type:
    | PropertyType.TITLE
    | PropertyType.TEXT
    | PropertyType.NUMBER
    | PropertyType.CHECKBOX
    | PropertyType.DATE;
}

export interface PageCompositionSelectPropertyDraft {
  ref: string;
  name: string;
  type: PropertyType.SELECT;

  options: PageCompositionPropertyOptionDraft[];
}

export interface PageCompositionPropertyOptionDraft {
  ref: string;
  name: string;
  color?: string | null;
}

export interface PageCompositionViewDraft {
  ref: string;
  name: string;
  type: PageCompositionViewType;
}

export interface PageCompositionRowDraft {
  ref?: string;

  values: Record<string, PageCompositionRowValueDraft>;
}

export type PageCompositionRowValueDraft =
  | string
  | number
  | boolean
  | PageCompositionDateValueDraft
  | PageCompositionSelectValueDraft
  | null;

export interface PageCompositionDateValueDraft {
  start: string;
  end?: string | null;
}

export interface PageCompositionSelectValueDraft {
  optionRef: string;
}
