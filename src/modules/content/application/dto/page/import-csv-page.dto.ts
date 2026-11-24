import { IsIn } from 'class-validator';
import { ImportDatabaseRowsRequest } from 'src/modules/database/presentation/http/requests/import-database-rows.request';
import type { ImportCsvTarget } from '../../commands/page/import-csv-page/import-csv-page.command';

export class ImportCsvPageDto extends ImportDatabaseRowsRequest {
  @IsIn(['child_page', 'current_page'])
  target!: ImportCsvTarget;
}
