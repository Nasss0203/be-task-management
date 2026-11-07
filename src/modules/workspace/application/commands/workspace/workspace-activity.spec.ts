import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { SoftDeleteWorkspaceCommand } from './soft-delete-workspace/soft-delete-workspace.command';
import { SoftDeleteWorkspaceHandler } from './soft-delete-workspace/soft-delete-workspace.handler';
import { UpdateWorkspaceCommand } from './update-workspace/update-workspace.command';
import { UpdateWorkspaceHandler } from './update-workspace/update-workspace.handler';

describe('workspace activity', () => {
  let workspace: Workspace | null;
  const repository = {
    findByUserIdAndWorkspaceId: jest.fn(() => Promise.resolve(workspace)),
    save: jest.fn((value: Workspace) => Promise.resolve(value)),
  };
  const activities = { create: jest.fn(() => Promise.resolve()) };
  const update = new UpdateWorkspaceHandler(
    repository as never,
    activities as never,
  );
  const softDelete = new SoftDeleteWorkspaceHandler(
    repository as never,
    activities as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    workspace = Workspace.create({ id: 'ws', name: 'Team', slug: 'team' });
  });

  it('records the changed field names, never the new name', async () => {
    await update.execute(
      new UpdateWorkspaceCommand('user-1', 'ws', { name: 'Secret plan' }),
    );

    expect(activities.create).toHaveBeenCalledWith({
      workspaceId: 'ws',
      entityType: ActivityEntityType.WORKSPACE,
      entityId: 'ws',
      actorId: 'user-1',
      action: ActivityAction.WORKSPACE_UPDATED,
      metadata: { fields: ['name'] },
    });
    expect(JSON.stringify(activities.create.mock.calls)).not.toContain(
      'Secret plan',
    );
  });

  it('records nothing when the update changes nothing', async () => {
    await update.execute(
      new UpdateWorkspaceCommand('user-1', 'ws', { name: 'Team' }),
    );

    expect(repository.save).toHaveBeenCalled();
    expect(activities.create).not.toHaveBeenCalled();
  });

  it('records a soft delete by the actor', async () => {
    await softDelete.execute(new SoftDeleteWorkspaceCommand('user-1', 'ws'));

    expect(activities.create).toHaveBeenCalledWith({
      workspaceId: 'ws',
      entityType: ActivityEntityType.WORKSPACE,
      entityId: 'ws',
      actorId: 'user-1',
      action: ActivityAction.WORKSPACE_DELETED,
    });
  });

  it('records nothing for a workspace the user cannot reach', async () => {
    workspace = null;

    await expect(
      softDelete.execute(new SoftDeleteWorkspaceCommand('user-1', 'ws')),
    ).rejects.toThrow('Workspace not found');
    await expect(
      update.execute(new UpdateWorkspaceCommand('user-1', 'ws', {})),
    ).rejects.toThrow('Workspace not found');
    expect(activities.create).not.toHaveBeenCalled();
  });
});
