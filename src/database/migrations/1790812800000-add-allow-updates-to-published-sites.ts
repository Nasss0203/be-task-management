import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAllowUpdatesToPublishedSites1790812800000 implements MigrationInterface {
  name = 'AddAllowUpdatesToPublishedSites1790812800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'published_sites',
      new TableColumn({
        name: 'allow_updates',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('published_sites', 'allow_updates');
  }
}
