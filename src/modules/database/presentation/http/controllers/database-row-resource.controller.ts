import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { DeleteDatabaseRowCommand } from 'src/modules/database/application/commands/delete-database-row/delete-database-row.command';
import { DeleteDatabaseRowHandler } from 'src/modules/database/application/commands/delete-database-row/delete-database-row.handler';
import { MoveDatabaseRowCommand } from 'src/modules/database/application/commands/move-database-row/move-database-row.command';
import { MoveDatabaseRowHandler } from 'src/modules/database/application/commands/move-database-row/move-database-row.handler';
import { MoveDatabaseRowRequest } from '../requests/move-database-row.request';

@Controller('database-rows')
export class DatabaseRowResourceController {
  constructor(
    private readonly deleteDatabaseRowHandler: DeleteDatabaseRowHandler,
    private readonly moveDatabaseRowHandler: MoveDatabaseRowHandler,
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

  @Patch(':rowId/position')
  @WorkspaceContext({ source: 'resource', type: 'database_row', key: 'rowId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async moveRow(
    @Param('rowId') rowId: string,
    @Body() request: MoveDatabaseRowRequest,
  ) {
    return this.moveDatabaseRowHandler.execute(
      new MoveDatabaseRowCommand(
        rowId,
        request.previousRowId ?? null,
        request.nextRowId ?? null,
      ),
    );
  }
}
