import { SetMetadata } from '@nestjs/common';

export const WORKSPACE_CONTEXT_KEY = 'workspace_context';

export type WorkspaceResourceType =
  | 'workspace'
  | 'page'
  | 'page_block'
  | 'attachment';

export type WorkspaceContextMeta =
  | { source: 'param' | 'body' | 'query'; key: string }
  | { source: 'resource'; type: WorkspaceResourceType; key: string };

export const WorkspaceContext = (meta: WorkspaceContextMeta) =>
  SetMetadata(WORKSPACE_CONTEXT_KEY, meta);
