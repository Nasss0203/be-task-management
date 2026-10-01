import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import {
  PAGE_COMPOSITION_SCHEMA_VERSION,
  type PageCompositionDraft,
} from '../../types/page-composition-draft';
import { PageCompositionPreviewResponseDto } from './page-composition-preview.response.dto';

describe('PageCompositionPreviewResponseDto', () => {
  it('builds a preview projection from a page composition draft', () => {
    const draft: PageCompositionDraft = {
      schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
      type: 'PAGE_COMPOSITION',

      page: {
        title: 'Sprint Planning',
        icon: '📋',
        coverUrl: 'https://example.com/cover.jpg',
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
              },
            },
            {
              ref: 'row_2',
              values: {
                property_title: 'Build dashboard',
              },
            },
          ],
        },
      ],
    };

    const result = PageCompositionPreviewResponseDto.fromDraft(draft);

    expect(result).toEqual({
      type: 'PAGE_COMPOSITION',
      page: {
        title: 'Sprint Planning',
        icon: '📋',
        cover_url: 'https://example.com/cover.jpg',
      },
      summary: {
        blocks: 2,
        databases: 1,
        database_rows: 2,
      },
    });
  });

  it('uses null for missing optional page metadata', () => {
    const draft: PageCompositionDraft = {
      schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
      type: 'PAGE_COMPOSITION',

      page: {
        title: 'Simple Page',
      },

      blocks: [],
      databases: [],
    };

    const result = PageCompositionPreviewResponseDto.fromDraft(draft);

    expect(result.page).toEqual({
      title: 'Simple Page',
      icon: null,
      cover_url: null,
    });

    expect(result.summary).toEqual({
      blocks: 0,
      databases: 0,
      database_rows: 0,
    });
  });
});
