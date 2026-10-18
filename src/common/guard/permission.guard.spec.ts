import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { PERMISSIONS_KEY } from '../decorator/require-permissions.decorator';
import {
  WORKSPACE_CONTEXT_KEY,
  WorkspaceContextMeta,
} from '../decorator/workspace-context.decorator';
import { WorkspaceResolverService } from '../services/workspace-resolver.service';
import { PermissionGuard } from './permission.guard';

const DATABASE_ID = '11111111-1111-4111-8111-111111111111';
const ROW_ID = '22222222-2222-4222-8222-222222222222';
const PAGE_ID = '33333333-3333-4333-8333-333333333333';
const WORKSPACE_ID = '44444444-4444-4444-8444-444444444444';

// Database endpoints must authorize against the page that owns the database
// (E2E C1: they were reachable from any workspace).
describe('PermissionGuard — database resources', () => {
  const setup = (meta: WorkspaceContextMeta, lookupRows: unknown[]) => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === PERMISSIONS_KEY
          ? ['page_block.read']
          : key === WORKSPACE_CONTEXT_KEY
            ? meta
            : undefined,
      ),
    } as unknown as Reflector;
    const dataSource = {
      query: jest.fn().mockResolvedValue(lookupRows),
    } as unknown as DataSource;
    const authorize = jest.fn().mockResolvedValue(true);
    const guard = new PermissionGuard(
      reflector,
      new WorkspaceResolverService(dataSource),
      { authorize } as never,
    );
    const req = {
      user: { id: 'user-1' },
      params: { databaseId: DATABASE_ID, rowId: ROW_ID },
      headers: { 'x-page-share-token': 'share-token' },
    };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    return { guard, context, authorize };
  };

  it.each([
    [{ source: 'resource', type: 'database', key: 'databaseId' }],
    [{ source: 'resource', type: 'database_row', key: 'rowId' }],
  ] as [WorkspaceContextMeta][])(
    'authorizes %o against its owning page, keeping the share token',
    async (meta) => {
      const { guard, context, authorize } = setup(meta, [
        { workspaceId: WORKSPACE_ID, pageId: PAGE_ID },
      ]);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(authorize).toHaveBeenCalledWith({
        userId: 'user-1',
        permissions: ['page_block.read'],
        target: { type: 'page', id: PAGE_ID },
        shareToken: 'share-token',
      });
    },
  );

  it('rejects an unknown database without calling authorization', async () => {
    const { guard, context, authorize } = setup(
      { source: 'resource', type: 'database', key: 'databaseId' },
      [],
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authorize).not.toHaveBeenCalled();
  });

  it('denies when the page authorization fails', async () => {
    const { guard, context, authorize } = setup(
      { source: 'resource', type: 'database', key: 'databaseId' },
      [{ workspaceId: WORKSPACE_ID, pageId: PAGE_ID }],
    );
    authorize.mockResolvedValue(false);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
