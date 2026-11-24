import type { PropertyType } from '../../../domain/enums/property-type.enum';

export type ImportColumnMapping = string | null | { type: PropertyType };

export class ImportDatabaseRowsCommand {
  constructor(
    public readonly databaseId: string,
    public readonly actorId: string,
    public readonly file: Buffer,
    public readonly mapping: ImportColumnMapping[] | null,
    public readonly timeZone: string | null,
    public readonly dryRun: boolean,
    public readonly membersPageId: string | null = null,
  ) {}
}
