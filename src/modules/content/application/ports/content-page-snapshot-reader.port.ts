import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface ContentPageSnapshot {
  page: {
    id: string;
    workspaceId: string;
    title: string;
    icon: string | null;
    coverUrl: string | null;
  };
  blocks: ContentPageBlockSnapshot[];
}

export interface ContentPageBlockSnapshot {
  sourceId: string;
  parentSourceId: string | null;

  type: PageBlockType;
  title: string | null;

  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;

  orderIndex: number;

  content: PageBlockJson;
  styleConfig: PageBlockStyleConfig;
  dataConfig: PageBlockJson;

  isOpen: boolean;
}

export interface ContentPageSnapshotReaderPort {
  getPageSnapshot(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<ContentPageSnapshot | null>;
}
