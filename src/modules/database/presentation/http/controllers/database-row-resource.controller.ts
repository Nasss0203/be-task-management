import { Controller, Delete, Param } from '@nestjs/common';
import { DeleteDatabaseRowCommand } from 'src/modules/database/application/commands/delete-database-row/delete-database-row.command';
import { DeleteDatabaseRowHandler } from 'src/modules/database/application/commands/delete-database-row/delete-database-row.handler';

@Controller('database-rows')
export class DatabaseRowResourceController {
  constructor(
    private readonly deleteDatabaseRowHandler: DeleteDatabaseRowHandler,
  ) {}

  @Delete(':rowId')
  async deleteRow(@Param('rowId') rowId: string) {
    await this.deleteDatabaseRowHandler.execute(
      new DeleteDatabaseRowCommand(rowId),
    );

    return {
      id: rowId,
    };
  }
}
