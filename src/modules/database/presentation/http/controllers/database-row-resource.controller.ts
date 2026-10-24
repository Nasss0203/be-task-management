import { Controller, Delete, Param } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { DeleteDatabaseRowCommand } from 'src/modules/database/application/commands/delete-database-row/delete-database-row.command';
import { DeleteDatabaseRowHandler } from 'src/modules/database/application/commands/delete-database-row/delete-database-row.handler';

@Controller('database-rows')
export class DatabaseRowResourceController {
  constructor(
    private readonly deleteDatabaseRowHandler: DeleteDatabaseRowHandler,
  ) {}

  @Delete(':rowId')
  @WorkspaceContext({ source: 'resource', type: 'database_row', key: 'rowId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async deleteRow(@Param('rowId') rowId: string) {
    await this.deleteDatabaseRowHandler.execute(
      new DeleteDatabaseRowCommand(rowId),
    );

    return {
      id: rowId,
    };
  }
}
