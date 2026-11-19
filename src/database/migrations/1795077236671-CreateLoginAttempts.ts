import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoginAttempts1795077236671 implements MigrationInterface {
  name = 'CreateLoginAttempts1795077236671';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"login_attempts\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"user_id\" uuid, \"attempted_email\" character varying(255), \"method\" character varying(16) NOT NULL, \"result\" character varying(16) NOT NULL, \"reason\" character varying(32), \"ip_address\" inet, \"user_agent\" character varying(255), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_070e613c8f768b1a70742705c5b\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_login_attempts_ip_created_at\" ON \"login_attempts\" (\"ip_address\", \"created_at\") ");
    await runner.query("CREATE INDEX \"IDX_login_attempts_user_created_at\" ON \"login_attempts\" (\"user_id\", \"created_at\") ");
    await runner.query("CREATE INDEX \"IDX_login_attempts_created_at\" ON \"login_attempts\" (\"created_at\") ");
    await runner.query("ALTER TABLE \"login_attempts\" ADD CONSTRAINT \"FK_5f88175f39e2b2ebf9e2295a9fd\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"login_attempts\" DROP CONSTRAINT \"FK_5f88175f39e2b2ebf9e2295a9fd\"");
    await runner.query("DROP INDEX \"public\".\"IDX_login_attempts_created_at\"");
    await runner.query("DROP INDEX \"public\".\"IDX_login_attempts_user_created_at\"");
    await runner.query("DROP INDEX \"public\".\"IDX_login_attempts_ip_created_at\"");
    await runner.query("DROP TABLE \"login_attempts\"");
  }
}
