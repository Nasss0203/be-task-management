import { BadGatewayException } from '@nestjs/common';

import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import { MAX_PAGE_COMPOSITION_ROWS } from '../constants/page-composition.constant';
import {
  PAGE_COMPOSITION_SCHEMA_VERSION,
  type PageCompositionDatabaseViewBlockDraft,
  type PageCompositionDraft,
} from '../types/page-composition-draft';
import { PageCompositionDraftValidator } from './page-composition-draft-validator.service';

function createValidDraft(): PageCompositionDraft {
  return {
    schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
    type: 'PAGE_COMPOSITION',

    page: {
      title: 'Sprint Planning',
      icon: null,
      coverUrl: null,
    },

    blocks: [
      {
        ref: 'block_intro',
        type: PageBlockType.TEXT,
        content: {
          text: 'Sprint planning content',
        },
      },
      {
        ref: 'block_tasks',
        type: PageBlockType.DATABASE_VIEW,
        databaseRef: 'database_tasks',
        viewRef: 'view_tasks',
      },
    ],

    databases: [
      {
        ref: 'database_tasks',
        name: 'Sprint Tasks',

        properties: [
          {
            ref: 'property_title',
            name: 'Task',
            type: PropertyType.TITLE,
          },
          {
            ref: 'property_description',
            name: 'Description',
            type: PropertyType.TEXT,
          },
          {
            ref: 'property_points',
            name: 'Points',
            type: PropertyType.NUMBER,
          },
          {
            ref: 'property_done',
            name: 'Done',
            type: PropertyType.CHECKBOX,
          },
          {
            ref: 'property_start_date',
            name: 'Start date',
            type: PropertyType.DATE,
          },
          {
            ref: 'property_status',
            name: 'Status',
            type: PropertyType.SELECT,
            options: [
              {
                ref: 'option_todo',
                name: 'Todo',
                color: '#6B7280',
              },
              {
                ref: 'option_doing',
                name: 'Doing',
                color: '#3B82F6',
              },
              {
                ref: 'option_done',
                name: 'Done',
                color: '#22C55E',
              },
            ],
          },
        ],

        views: [
          {
            ref: 'view_tasks',
            name: 'Table',
            type: DatabaseViewType.TABLE,
          },
        ],

        rows: [
          {
            ref: 'row_1',
            values: {
              property_title: 'Implement login',
              property_description: 'Create login flow',
              property_points: 3,
              property_done: false,
              property_start_date: {
                start: '2026-09-30',
              },
              property_status: {
                optionRef: 'option_todo',
              },
            },
          },
        ],
      },
    ],
  };
}

describe('PageCompositionDraftValidator', () => {
  let validator: PageCompositionDraftValidator;

  beforeEach(() => {
    validator = new PageCompositionDraftValidator();
  });

  it('accepts a valid page composition draft', () => {
    const draft = createValidDraft();

    const result = validator.validate(draft);

    expect(result).toBe(draft);
  });

  it('rejects duplicate block refs after normalization', () => {
    const draft = createValidDraft();

    draft.blocks.push({
      ref: ' block_intro ',
      type: PageBlockType.TEXT,
      content: {
        text: 'Duplicate block',
      },
    });

    expect(() => validator.validate(draft)).toThrow(
      'Duplicate block ref: block_intro',
    );
  });

  it('rejects a block parent cycle', () => {
    const draft = createValidDraft();

    draft.blocks = [
      {
        ref: 'toggle_a',
        type: PageBlockType.TOGGLE,
        parentRef: 'toggle_b',
        content: {
          text: 'Toggle A',
        },
      },
      {
        ref: 'toggle_b',
        type: PageBlockType.TOGGLE,
        parentRef: 'toggle_a',
        content: {
          text: 'Toggle B',
        },
      },
    ];

    expect(() => validator.validate(draft)).toThrow(
      'Block parent cycle detected',
    );
  });

  it('rejects a DATABASE_VIEW block referencing an unknown database', () => {
    const draft = createValidDraft();

    const databaseViewBlock = draft
      .blocks[1] as PageCompositionDatabaseViewBlockDraft;

    databaseViewBlock.databaseRef = 'database_missing';

    expect(() => validator.validate(draft)).toThrow(
      'references unknown databaseRef database_missing',
    );
  });

  it('rejects a DATABASE_VIEW block referencing an unknown view', () => {
    const draft = createValidDraft();

    const databaseViewBlock = draft
      .blocks[1] as PageCompositionDatabaseViewBlockDraft;

    databaseViewBlock.viewRef = 'view_missing';

    expect(() => validator.validate(draft)).toThrow(
      'references unknown viewRef view_missing',
    );
  });

  it('rejects an invalid row value for a NUMBER property', () => {
    const draft = createValidDraft();

    draft.databases[0].rows[0].values.property_points = 'three';

    expect(() => validator.validate(draft)).toThrow('property property_points');

    expect(() => validator.validate(draft)).toThrow('requires a number value');
  });

  it('rejects an unknown SELECT optionRef', () => {
    const draft = createValidDraft();

    draft.databases[0].rows[0].values.property_status = {
      optionRef: 'option_missing',
    };

    expect(() => validator.validate(draft)).toThrow(
      'references unknown optionRef option_missing',
    );
  });

  it('rejects drafts exceeding the maximum row limit', () => {
    const draft = createValidDraft();

    draft.databases[0].rows = Array.from(
      {
        length: MAX_PAGE_COMPOSITION_ROWS + 1,
      },
      (_, index) => ({
        ref: `row_${index + 1}`,
        values: {
          property_title: `Task ${index + 1}`,
        },
      }),
    );

    expect(() => validator.validate(draft)).toThrow(
      `exceeds the maximum of ${MAX_PAGE_COMPOSITION_ROWS} rows`,
    );
  });

  it('throws BadGatewayException for an invalid draft', () => {
    const draft = createValidDraft();

    (
      draft as unknown as {
        schemaVersion: number;
      }
    ).schemaVersion = 999;

    expect(() => validator.validate(draft)).toThrow(BadGatewayException);
  });
});
