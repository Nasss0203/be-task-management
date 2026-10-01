import type { PageCompositionDraft } from '../../types/page-composition-draft';

export class PageCompositionPreviewPageResponseDto {
  title: string;
  icon: string | null;
  cover_url: string | null;
}

export class PageCompositionPreviewSummaryResponseDto {
  blocks: number;
  databases: number;
  database_rows: number;
}

export class PageCompositionPreviewResponseDto {
  type: 'PAGE_COMPOSITION';
  page: PageCompositionPreviewPageResponseDto;
  summary: PageCompositionPreviewSummaryResponseDto;

  static fromDraft(
    draft: PageCompositionDraft,
  ): PageCompositionPreviewResponseDto {
    return {
      type: draft.type,
      page: {
        title: draft.page.title,
        icon: draft.page.icon ?? null,
        cover_url: draft.page.coverUrl ?? null,
      },
      summary: {
        blocks: draft.blocks.length,
        databases: draft.databases.length,
        database_rows: draft.databases.reduce(
          (total, database) => total + database.rows.length,
          0,
        ),
      },
    };
  }
}
