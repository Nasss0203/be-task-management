import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleCalendarSyncAssignedToMeOnly1793877495797 implements MigrationInterface {
  name = 'AddGoogleCalendarSyncAssignedToMeOnly1793877495797';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"google_calendar_syncs\" ADD \"assigned_to_me_only\" boolean NOT NULL DEFAULT false");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"google_calendar_syncs\" DROP COLUMN \"assigned_to_me_only\"");
  }
}
