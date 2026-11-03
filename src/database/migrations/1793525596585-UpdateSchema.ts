import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1793525596585 implements MigrationInterface {
  name = 'UpdateSchema1793525596585';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"form_answer_keys\" ADD CONSTRAINT \"CHK_form_answer_keys_points_positive\" CHECK (\"points\" > 0)");
    await runner.query("ALTER TABLE \"form_answer_keys\" ADD CONSTRAINT \"FK_6bfbed223502a0b75f6e098e0ac\" FOREIGN KEY (\"field_block_id\") REFERENCES \"page_blocks\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"form_quiz_attempts\" ADD CONSTRAINT \"FK_ca0d3f309683bf9cc6afa2fe213\" FOREIGN KEY (\"section_block_id\") REFERENCES \"page_blocks\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"form_quiz_attempts\" ADD CONSTRAINT \"FK_a31559b54f701319c26bde914b9\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"form_quiz_attempts\" ADD CONSTRAINT \"FK_b2a6d2b6aa74fba97186ef7584b\" FOREIGN KEY (\"row_id\") REFERENCES \"database_rows\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"form_quiz_attempts\" DROP CONSTRAINT \"FK_b2a6d2b6aa74fba97186ef7584b\"");
    await runner.query("ALTER TABLE \"form_quiz_attempts\" DROP CONSTRAINT \"FK_a31559b54f701319c26bde914b9\"");
    await runner.query("ALTER TABLE \"form_quiz_attempts\" DROP CONSTRAINT \"FK_ca0d3f309683bf9cc6afa2fe213\"");
    await runner.query("ALTER TABLE \"form_answer_keys\" DROP CONSTRAINT \"FK_6bfbed223502a0b75f6e098e0ac\"");
    await runner.query("ALTER TABLE \"form_answer_keys\" DROP CONSTRAINT \"CHK_form_answer_keys_points_positive\"");
  }
}
