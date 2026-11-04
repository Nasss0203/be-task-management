import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormAnswerKeys1793525353079 implements MigrationInterface {
  name = 'CreateFormAnswerKeys1793525353079';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"form_answer_keys\" (\"field_block_id\" uuid NOT NULL, \"correct_value\" jsonb NOT NULL, \"points\" integer NOT NULL, CONSTRAINT \"PK_6bfbed223502a0b75f6e098e0ac\" PRIMARY KEY (\"field_block_id\"))");
    await runner.query("CREATE TABLE \"form_quiz_attempts\" (\"id\" uuid NOT NULL, \"section_block_id\" uuid NOT NULL, \"user_id\" uuid NOT NULL, \"attempt_no\" integer NOT NULL, \"row_id\" uuid, \"score\" integer NOT NULL, \"max_score\" integer NOT NULL, \"results\" jsonb NOT NULL, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"UQ_form_quiz_attempts_section_user_attempt\" UNIQUE (\"section_block_id\", \"user_id\", \"attempt_no\"), CONSTRAINT \"PK_647ba43796744cf569bd5e7634e\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_form_quiz_attempts_row_id\" ON \"form_quiz_attempts\" (\"row_id\") ");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"IDX_form_quiz_attempts_row_id\"");
    await runner.query("DROP TABLE \"form_quiz_attempts\"");
    await runner.query("DROP TABLE \"form_answer_keys\"");
  }
}
