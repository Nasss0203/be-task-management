import { MigrationInterface, QueryRunner } from 'typeorm';

const ENTITY_TYPES = ['DATABASE', 'DATABASE_ROW', 'TEAMSPACE'];

const ACTIONS = [
  'DATABASE_CREATED',
  'DATABASE_RENAMED',
  'DATABASE_PROPERTY_ADDED',
  'DATABASE_PROPERTY_UPDATED',
  'DATABASE_PROPERTY_DELETED',
  'DATABASE_ROW_CREATED',
  'DATABASE_ROW_UPDATED',
  'DATABASE_ROW_DELETED',
  'DATABASE_ROW_MOVED',
  'WORKSPACE_UPDATED',
  'WORKSPACE_DELETED',
  'WORKSPACE_RESTORED',
  'TEAMSPACE_CREATED',
  'TEAMSPACE_UPDATED',
  'TEAMSPACE_ARCHIVED',
  'TEAMSPACE_RESTORED',
  'TEAMSPACE_MEMBER_JOINED',
  'TEAMSPACE_MEMBER_REMOVED',
  'TEAMSPACE_MEMBER_ROLE_CHANGED',
  'TEAMSPACE_MEMBER_LEFT',
];

export class AddActivityDatabaseTeamspaceValues1794034110858
  implements MigrationInterface
{
  name = 'AddActivityDatabaseTeamspaceValues1794034110858';

  async up(runner: QueryRunner): Promise<void> {
    for (const value of ENTITY_TYPES) {
      await runner.query(
        `ALTER TYPE "public"."activities_entity_type_enum" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
    for (const value of ACTIONS) {
      await runner.query(
        `ALTER TYPE "public"."activities_action_enum" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
  }

  async down(): Promise<void> {}
}
