import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type DataSource } from 'typeorm';
import { FeatureKey } from '../../modules/features/constants/feature-key.constant';
import { type FeatureAccessService } from '../../modules/features/interfaces/services/feature-access.service.interface';
import { PERMISSIONS } from '../../modules/permission/constants/permission.constant';
import { type FindPermissionService } from '../../modules/permission/interfaces/services/find-all-permission.service.interface';
import { TasksController } from '../../modules/tasks/controller/tasks.controller';
import { SystemRole } from '../../modules/users/domain/entities/user.entity';
import { WorkspaceResolverService } from '../services/workspace-resolver.service';
import { FeatureGuard } from './feature.guard';
import { PermissionGuard } from './permission.guard';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const WORKSPACE_ID = '22222222-2222-4222-8222-222222222222';
const CACHED_WORKSPACE_ID = '33333333-3333-4333-8333-333333333333';
const PROJECT_ID = '44444444-4444-4444-8444-444444444444';
const BACKLOG_HANDLER = Object.getOwnPropertyDescriptor(
  TasksController.prototype,
  'findAllBacklogTask',
)?.value as () => unknown;

type RequestMock = {
  user?: {
    id?: string;
    systemRole?: SystemRole;
  };
  params?: Record<string, string>;
  body?: Record<string, string>;
  query?: Record<string, string>;
  workspaceId?: string;
};

describe('workspace authorization guards', () => {
  let reflector: Reflector;
  let workspaceResolver: WorkspaceResolverService;
  let featureAccessService: jest.Mocked<FeatureAccessService>;
  let findPermissionService: jest.Mocked<FindPermissionService>;
  let featureGuard: FeatureGuard;
  let permissionGuard: PermissionGuard;

  beforeEach(() => {
    reflector = new Reflector();
    const dataSource = {
      query: jest.fn(),
    };

    workspaceResolver = new WorkspaceResolverService(
      dataSource as unknown as DataSource,
    );
    featureAccessService = {
      assertUserWorkspaceMembership: jest.fn().mockResolvedValue(undefined),
      assertFeatureEnabledForWorkspace: jest.fn().mockResolvedValue(undefined),
      isFeatureEnabledForWorkspace: jest.fn().mockResolvedValue(true),
    };
    findPermissionService = {
      findPermissionsByUserAndWorkspace: jest.fn(),
    };

    featureGuard = new FeatureGuard(
      reflector,
      workspaceResolver,
      featureAccessService,
    );
    permissionGuard = new PermissionGuard(
      reflector,
      workspaceResolver,
      findPermissionService,
    );
  });

  it('allows the backlog endpoint for a workspace user with TASK_READ and SPRINT_ENABLED', async () => {
    const req = createBacklogRequest();
    const context = createBacklogContext(req);

    findPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue([
      PERMISSIONS.TASK_READ,
    ]);

    await expect(featureGuard.canActivate(context)).resolves.toBe(true);
    await expect(permissionGuard.canActivate(context)).resolves.toBe(true);

    expect(
      featureAccessService.assertUserWorkspaceMembership.mock.calls,
    ).toContainEqual([USER_ID, WORKSPACE_ID]);
    expect(
      featureAccessService.assertFeatureEnabledForWorkspace.mock.calls,
    ).toContainEqual([WORKSPACE_ID, FeatureKey.SPRINT_ENABLED]);
    expect(
      findPermissionService.findPermissionsByUserAndWorkspace.mock.calls,
    ).toContainEqual([USER_ID, WORKSPACE_ID]);
  });

  it('rejects the backlog endpoint when TASK_READ is missing', async () => {
    const context = createBacklogContext(createBacklogRequest());
    findPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue(
      [],
    );

    await expect(permissionGuard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects the backlog endpoint when SPRINT_ENABLED is missing', async () => {
    const context = createBacklogContext(createBacklogRequest());
    featureAccessService.assertFeatureEnabledForWorkspace.mockRejectedValue(
      new ForbiddenException(
        `Feature "${FeatureKey.SPRINT_ENABLED}" is not available for current plan`,
      ),
    );

    await expect(featureGuard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('resolves backlog workspaceId from route params via @WorkspaceContext', async () => {
    const req = createBacklogRequest({
      workspaceId: CACHED_WORKSPACE_ID,
    });
    const context = createBacklogContext(req);

    await expect(featureGuard.canActivate(context)).resolves.toBe(true);

    expect(
      featureAccessService.assertUserWorkspaceMembership.mock.calls,
    ).toContainEqual([USER_ID, WORKSPACE_ID]);
    expect(req.workspaceId).toBe(WORKSPACE_ID);
  });
});

function createBacklogRequest(
  overrides: Partial<RequestMock> = {},
): RequestMock {
  return {
    user: {
      id: USER_ID,
      systemRole: SystemRole.USER,
    },
    params: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
    },
    query: {},
    ...overrides,
  };
}

function createBacklogContext(req: RequestMock): ExecutionContext {
  return {
    getHandler: () => BACKLOG_HANDLER,
    getClass: () => TasksController,
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
}
