import type { ImportColumnMapping } from 'src/modules/database/application/commands/import-database-rows/import-database-rows.command';

export type ImportCsvTarget = 'child_page' | 'current_page';

export class ImportCsvPageCommand {
  constructor(
    public readonly pageId: string,
    public readonly userId: string,
    public readonly target: ImportCsvTarget,
    public readonly fileName: string,
    public readonly file: Buffer,
    public readonly mapping: ImportColumnMapping[] | null,
    public readonly timeZone: string | null,
    public readonly dryRun: boolean,
  ) {}
}
