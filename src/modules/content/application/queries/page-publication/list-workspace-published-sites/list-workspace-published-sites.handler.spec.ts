import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { WorkspaceResolverService } from 'src/common/services/workspace-resolver.service';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PublishedSite } from '../../../../domain/entities/published-site.entity';
import { PublishedSiteMapper } from '../../../../infrastructure/persistence/typeorm/mappers/published-site.mapper';
import { PublishedSiteOrmEntity } from '../../../../infrastructure/persistence/typeorm/entities/published-site.orm-entity';
import { TypeOrmPublishedSiteRepository } from '../../../../infrastructure/persistence/typeorm/repositories/typeorm-published-site.repository';
import { WorkspacePublishedSitesController } from '../../../../presentation/http/controllers/workspace-published-sites.controller';
import { ListWorkspacePublishedSitesHandler } from './list-workspace-published-sites.handler';
import { ListWorkspacePublishedSitesQuery } from './list-workspace-published-sites.query';

describe('List workspace published sites', () => {
  const workspaceId = '11111111-1111-4111-8111-111111111111';
  const otherWorkspaceId = '22222222-2222-4222-8222-222222222222';
  const site = (
    id: string,
    workspace: string,
    createdAt: string,
    disabledAt: Date | null = null,
  ) =>
    PublishedSiteMapper.toOrm(
      PublishedSite.restore({
        id,
        workspaceId: workspace,
        rootPageId: 'root',
        subdomain: id,
        createdBy: 'user',
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
        disabledAt,
      }),
    );
  const rows = [
    site('old', workspaceId, '2026-01-01'),
    site('new', workspaceId, '2026-02-01'),
    site('disabled', workspaceId, '2026-03-01', new Date()),
    site('other', otherWorkspaceId, '2026-04-01'),
  ];
  const find = jest.fn((options: { where: { workspace_id: string } }) =>
    Promise.resolve(
      rows.filter((row) => row.workspace_id === options.where.workspace_id),
    ),
  );
  const repository = new TypeOrmPublishedSiteRepository({
    find,
  } as unknown as Repository<PublishedSiteOrmEntity>);
  const handler = new ListWorkspacePublishedSitesHandler(repository);

  beforeEach(() => find.mockClear());

  it('returns two active sites in stable descending creation order with minimal DTO fields', async () => {
    const result = await handler.execute(
      new ListWorkspacePublishedSitesQuery(workspaceId),
    );
    expect(result.map((item) => item.id)).toEqual(['new', 'old']);
    expect(Object.keys(result[0]).sort()).toEqual(
      [
        'id',
        'workspace_id',
        'root_page_id',
        'subdomain',
        'disabled_at',
        'created_at',
      ].sort(),
    );
    expect(result.every((item) => item.disabled_at === null)).toBe(true);
    expect(find).toHaveBeenCalledWith({
      where: { workspace_id: workspaceId },
      order: { created_at: 'ASC' },
    });
  });

  it('scopes persistence lookup to the requested workspace', async () => {
    const result = await handler.execute(
      new ListWorkspacePublishedSitesQuery(otherWorkspaceId),
    );
    expect(result.map((item) => item.id)).toEqual(['other']);
    expect(result.every((item) => item.workspace_id === otherWorkspaceId)).toBe(
      true,
    );
  });

  it('returns an empty list when no sites exist', async () => {
    expect(
      await handler.execute(new ListWorkspacePublishedSitesQuery('empty')),
    ).toEqual([]);
  });

  function permissionContext(user?: { id: string }): ExecutionContext {
    return {
      // Nest reads handler metadata without invoking the unbound method.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getHandler: () => WorkspacePublishedSitesController.prototype.list,
      getClass: () => WorkspacePublishedSitesController,
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { workspaceId } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('requires workspace read permission and rejects unauthorized users', async () => {
    const resolve = jest.fn().mockResolvedValue(workspaceId);
    const authorize = jest.fn().mockResolvedValue(false);
    const guard = new PermissionGuard(
      new Reflector(),
      { resolve } as unknown as WorkspaceResolverService,
      { authorize } as unknown as AuthorizationService,
    );
    await expect(
      guard.canActivate(permissionContext({ id: 'user' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(resolve).toHaveBeenCalledWith(
      expect.anything(),
      { source: 'param', key: 'workspaceId' },
      ['workspace'],
    );
    expect(authorize).toHaveBeenCalledWith({
      userId: 'user',
      permissions: [PERMISSIONS.WORKSPACE_READ],
      target: { type: 'workspace', id: workspaceId },
      shareToken: undefined,
    });
    authorize.mockResolvedValue(true);
    await expect(
      guard.canActivate(permissionContext({ id: 'user' })),
    ).resolves.toBe(true);
  });

  it('rejects requests without an authenticated user', async () => {
    const authorize = jest.fn();
    const guard = new PermissionGuard(
      new Reflector(),
      { resolve: jest.fn() } as unknown as WorkspaceResolverService,
      { authorize } as unknown as AuthorizationService,
    );
    await expect(guard.canActivate(permissionContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authorize).not.toHaveBeenCalled();
  });
});
