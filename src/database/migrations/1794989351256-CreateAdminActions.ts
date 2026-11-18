import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminActions1794989351256 implements MigrationInterface {
  name = 'CreateAdminActions1794989351256';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"admin_actions\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"actor_user_id\" uuid, \"action\" character varying(64) NOT NULL, \"target_type\" character varying(32) NOT NULL, \"target_id\" uuid, \"changes\" jsonb NOT NULL DEFAULT '{}', \"ip_address\" inet, \"user_agent\" character varying(255), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_08d0b319675c4968ff9e0dca4c3\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_admin_actions_target\" ON \"admin_actions\" (\"target_type\", \"target_id\") ");
    await runner.query("CREATE INDEX \"IDX_admin_actions_actor_created_at\" ON \"admin_actions\" (\"actor_user_id\", \"created_at\") ");
    await runner.query("CREATE INDEX \"IDX_admin_actions_created_at\" ON \"admin_actions\" (\"created_at\") ");
    await runner.query("ALTER TABLE \"admin_actions\" ADD CONSTRAINT \"FK_73d1f7ab9e40e5bc91fc2940b5f\" FOREIGN KEY (\"actor_user_id\") REFERENCES \"users\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"admin_actions\" DROP CONSTRAINT \"FK_73d1f7ab9e40e5bc91fc2940b5f\"");
    await runner.query("DROP INDEX \"public\".\"IDX_admin_actions_created_at\"");
    await runner.query("DROP INDEX \"public\".\"IDX_admin_actions_actor_created_at\"");
    await runner.query("DROP INDEX \"public\".\"IDX_admin_actions_target\"");
    await runner.query("DROP TABLE \"admin_actions\"");
  }
}
