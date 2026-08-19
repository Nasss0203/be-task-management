import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanLegacyPermissions1787150235272 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN (
        'workspace.billing.read', 'workspace.billing.manage', 'workspace.usage.read', 'workspace.role.manage',
        'project.create', 'project.read', 'project.update', 'project.delete',
        'board.create', 'board.read', 'board.update', 'board.delete',
        'task.create', 'task.read', 'task.update', 'task.delete',
        'task.assignee.add', 'task.assignee.remove',
        'task.comment.create', 'task.comment.read', 'task.comment.update', 'task.comment.delete',
        'sprint.create', 'sprint.read', 'sprint.update', 'sprint.delete', 'sprint.start', 'sprint.complete', 'sprint.cancel',
        'task_status.read', 'task_status.manage',
        'task_priority.read', 'task_priority.manage',
        'audit_log.read'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op for down migration since we don't want to re-insert legacy data automatically
  }
}
