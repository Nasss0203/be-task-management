import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';
import { WorkspaceOrmEntity } from '../entities/workspace.orm-entity';
import { WorkspaceMapper } from './workspace.mapper';

describe('WorkspaceMapper', () => {
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  it('maps ORM entity to domain aggregate', () => {
    const entity = new WorkspaceOrmEntity();
    entity.id = 'workspace-1';
    entity.name = 'Task management';
    entity.slug = 'task-management';
    entity.layoutMode = WorkspaceLayoutMode.TABS;
    entity.createdAt = createdAt;
    entity.updatedAt = updatedAt;
    entity.deletedAt = null;
    entity.deletedBy = null;
    entity.createdBy = 'user-1';

    const domain = WorkspaceMapper.toDomain(entity);

    expect(domain).toBeInstanceOf(Workspace);
    expect(domain.getId()).toBe('workspace-1');
    expect(domain.getName()).toBe('Task management');
    expect(domain.getCreatedBy()).toBe('user-1');
  });

  it('maps domain aggregate to ORM entity', () => {
    const domain = Workspace.restore({
      id: 'workspace-1',
      name: 'Task management',
      slug: 'task-management',
      layoutMode: WorkspaceLayoutMode.TABS,
      createdAt,
      updatedAt,
      deletedAt: null,
      deletedBy: null,
      createdBy: 'user-1',
    });

    const entity = WorkspaceMapper.toOrm(domain);

    expect(entity).toBeInstanceOf(WorkspaceOrmEntity);
    expect(entity.id).toBe('workspace-1');
    expect(entity.name).toBe('Task management');
    expect(entity.createdBy).toBe('user-1');
  });
});
