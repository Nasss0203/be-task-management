import { HttpStatus } from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { CreateWorkspaceServiceImpl } from './create-workspace.service';

describe('CreateWorkspaceServiceImpl', () => {
  const manager = {} as any;

  const workspaceRepo = {
    existsBySlug: jest.fn(),
    save: jest.fn(),
  };

  const createWorkspaceMemberService = {
    create: jest.fn(),
  };

  const createPageService = {
    createDefault: jest.fn(),
  };

  const uow = {
    runInTransaction: jest.fn((callback) => callback(manager)),
  };

  let service: CreateWorkspaceServiceImpl;
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    service = new CreateWorkspaceServiceImpl(
      workspaceRepo as any,
      createWorkspaceMemberService as any,
      createPageService as any,
      uow as any,
    );
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('creates a default V2 workspace with owner membership and root page', async () => {
    const userId = 'user-123456';
    const workspace = {
      id: 'workspace-1',
      name: 'Task management',
      slug: 'task-management-user-1-1234567890',
      planType: PlanTypeWorkspace.FREE,
    };

    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue(workspace);

    const result = await service.createDefault({ userId });

    expect(result).toBe(workspace);
    expect(uow.runInTransaction).toHaveBeenCalled();
    expect(workspaceRepo.existsBySlug).toHaveBeenCalledWith(
      workspace.slug,
      manager,
    );
    expect(workspaceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: workspace.name,
        slug: workspace.slug,
        planType: PlanTypeWorkspace.FREE,
        createdBy: userId,
      }),
      manager,
    );
    expect(createWorkspaceMemberService.create).toHaveBeenCalledWith(
      {
        user_id: userId,
        workspace_id: workspace.id,
        role_name: WorkspaceRole.OWNER,
      },
      manager,
    );
    expect(createPageService.createDefault).toHaveBeenCalledWith(
      {
        workspace_id: workspace.id,
        title: workspace.name,
        slug: workspace.slug,
        created_by: userId,
      },
      manager,
    );
  });

  it('throws conflict exception if generated workspace slug already exists', async () => {
    workspaceRepo.existsBySlug.mockResolvedValue(true);

    await expect(
      service.createDefault({ userId: 'user-123456' }),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });

    expect(workspaceRepo.save).not.toHaveBeenCalled();
    expect(createWorkspaceMemberService.create).not.toHaveBeenCalled();
    expect(createPageService.createDefault).not.toHaveBeenCalled();
  });
});
