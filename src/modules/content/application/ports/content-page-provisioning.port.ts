import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface CreatePageBlockSnapshotInput {
  sourceId: string;
  parentSourceId?: string | null;

  type: PageBlockType;
  title?: string | null;

  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;

  orderIndex: number;

  content?: PageBlockJson;
  styleConfig?: PageBlockStyleConfig;
  dataConfig?: PageBlockJson;

  isOpen?: boolean;
}

export interface CreatePageShellInput {
  workspaceId: string;
  title: string;
  createdBy: string;

  slug?: string;

  icon?: string | null;
  coverUrl?: string | null;
}

export interface CreatePageBlocksFromSnapshotInput {
  pageId: string;
  createdBy: string;
  blocks: CreatePageBlockSnapshotInput[];
}

export interface CreatePageFromSnapshotInput {
  workspaceId: string;
  title: string;
  createdBy: string;

  slug?: string;

  icon?: string | null;
  coverUrl?: string | null;

  blocks: CreatePageBlockSnapshotInput[];
}

export interface ProvisionedPageResult {
  pageId: string;
}
export type CreateDefaultPageInput = {
  workspaceId: string;
  title: string;
  slug: string;
  createdBy: string;
};

export interface ContentPageProvisioningPort {
  createDefaultPage(
    input: CreateDefaultPageInput,
    context?: PersistenceContext,
  ): Promise<void>;

  createPageShell(
    input: CreatePageShellInput,
    context?: PersistenceContext,
  ): Promise<ProvisionedPageResult>;

  createBlocksFromSnapshot(
    input: CreatePageBlocksFromSnapshotInput,
    context?: PersistenceContext,
  ): Promise<void>;

  createPageFromSnapshot(
    input: CreatePageFromSnapshotInput,
    context?: PersistenceContext,
  ): Promise<ProvisionedPageResult>;
}
