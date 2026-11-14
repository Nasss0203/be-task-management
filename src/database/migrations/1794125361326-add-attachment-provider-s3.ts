import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttachmentProviderS31794125361326 implements MigrationInterface {
  name = 'AddAttachmentProviderS31794125361326';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TYPE "public"."attachments_provider_enum" ADD VALUE IF NOT EXISTS 'S3'`,
    );
  }

  async down(): Promise<void> {}
}
