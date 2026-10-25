import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { CreateDatabaseViewCommand } from '../../../application/commands/create-database-view/create-database-view.command';
import { CreateDatabaseViewHandler } from '../../../application/commands/create-database-view/create-database-view.handler';

import { DeleteDatabaseViewCommand } from 'src/modules/database/application/commands/delete-database-view/delete-database-view.command';
import { DeleteDatabaseViewHandler } from 'src/modules/database/application/commands/delete-database-view/delete-database-view.handler';
import { RenameDatabaseViewCommand } from 'src/modules/database/application/commands/rename-database-view/rename-database-view.command';
import { RenameDatabaseViewHandler } from 'src/modules/database/application/commands/rename-database-view/rename-database-view.handler';
import { SetViewPropertyVisibilityCommand } from 'src/modules/database/application/commands/set-view-property-visibility/set-view-property-visibility.command';
import { SetViewPropertyVisibilityHandler } from 'src/modules/database/application/commands/set-view-property-visibility/set-view-property-visibility.handler';
import { SetViewPropertyWidthCommand } from 'src/modules/database/application/commands/set-view-property-width/set-view-property-width.command';
import { SetViewPropertyWidthHandler } from 'src/modules/database/application/commands/set-view-property-width/set-view-property-width.handler';
import { GetDatabaseViewHandler } from 'src/modules/database/application/queries/get-database-view/get-database-view.handler';
import { GetDatabaseViewQuery } from 'src/modules/database/application/queries/get-database-view/get-database-view.query';
import { GetDatabaseViewsHandler } from 'src/modules/database/application/queries/get-database-views/get-database-views.handler';
import { GetDatabaseViewsQuery } from 'src/modules/database/application/queries/get-database-views/get-database-views.query';
import { CreateDatabaseViewRequest } from '../requests/create-database-view.request';
import { RenameDatabaseViewRequest } from '../requests/rename-database-view.request';
import { SetViewPropertyVisibilityRequest } from '../requests/set-view-property-visibility.request';
import { SetViewPropertyWidthRequest } from '../requests/set-view-property-width.request';
import { SetViewSortsCommand } from 'src/modules/database/application/commands/set-view-sorts/set-view-sorts.command';
import { SetViewSortsHandler } from 'src/modules/database/application/commands/set-view-sorts/set-view-sorts.handler';
import { SetViewSortsRequest } from '../requests/set-view-sorts.request';
import { SetViewFiltersCommand } from 'src/modules/database/application/commands/set-view-filters/set-view-filters.command';
import { SetViewFiltersHandler } from 'src/modules/database/application/commands/set-view-filters/set-view-filters.handler';
import { SetViewFiltersRequest } from '../requests/set-view-filters.request';
import { SetViewGroupCommand } from 'src/modules/database/application/commands/set-view-group/set-view-group.command';
import { SetViewGroupHandler } from 'src/modules/database/application/commands/set-view-group/set-view-group.handler';
import { SetViewGroupRequest } from '../requests/set-view-group.request';

@Controller('databases/:databaseId/views')
export class DatabaseViewController {
  constructor(
    private readonly createDatabaseViewHandler: CreateDatabaseViewHandler,
    private readonly deleteDatabaseViewHandler: DeleteDatabaseViewHandler,
    private readonly getDatabaseViewsHandler: GetDatabaseViewsHandler,
    private readonly renameDatabaseViewHandler: RenameDatabaseViewHandler,
    private readonly getDatabaseViewHandler: GetDatabaseViewHandler,
    private readonly setViewPropertyVisibilityHandler: SetViewPropertyVisibilityHandler,
    private readonly setViewPropertyWidthHandler: SetViewPropertyWidthHandler,
    private readonly setViewSortsHandler: SetViewSortsHandler,
    private readonly setViewFiltersHandler: SetViewFiltersHandler,
    private readonly setViewGroupHandler: SetViewGroupHandler,
  ) {}

  @Post()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  async createView(
    @Param('databaseId') databaseId: string,
    @Body() request: CreateDatabaseViewRequest,
  ) {
    return this.createDatabaseViewHandler.execute(
      new CreateDatabaseViewCommand(databaseId, request.name, request.type),
    );
  }

  @Get()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  async getViews(@Param('databaseId') databaseId: string) {
    return this.getDatabaseViewsHandler.execute(
      new GetDatabaseViewsQuery(databaseId),
    );
  }

  @Get(':viewId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  async getView(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
  ) {
    return this.getDatabaseViewHandler.execute(
      new GetDatabaseViewQuery(databaseId, viewId),
    );
  }

  @Patch(':viewId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async renameView(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
    @Body() request: RenameDatabaseViewRequest,
  ) {
    return this.renameDatabaseViewHandler.execute(
      new RenameDatabaseViewCommand(databaseId, viewId, request.name),
    );
  }

  @Patch(':viewId/properties/:propertyId/visibility')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async setPropertyVisibility(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
    @Param('propertyId') propertyId: string,
    @Body() request: SetViewPropertyVisibilityRequest,
  ) {
    return this.setViewPropertyVisibilityHandler.execute(
      new SetViewPropertyVisibilityCommand(
        databaseId,
        viewId,
        propertyId,
        request.visible,
      ),
    );
  }

  @Patch(':viewId/properties/:propertyId/width')
  // Added after the database authorization fix; same rule as the visibility toggle.
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async setPropertyWidth(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
    @Param('propertyId') propertyId: string,
    @Body() request: SetViewPropertyWidthRequest,
  ) {
    return this.setViewPropertyWidthHandler.execute(
      new SetViewPropertyWidthCommand(
        databaseId,
        viewId,
        propertyId,
        request.width,
      ),
    );
  }

  @Patch(':viewId/sorts')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async setSorts(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
    @Body() request: SetViewSortsRequest,
  ) {
    return this.setViewSortsHandler.execute(
      new SetViewSortsCommand(databaseId, viewId, request.sorts),
    );
  }

  @Patch(':viewId/filters')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async setFilters(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
    @Body() request: SetViewFiltersRequest,
  ) {
    return this.setViewFiltersHandler.execute(
      new SetViewFiltersCommand(databaseId, viewId, request.filters),
    );
  }

  @Patch(':viewId/group')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async setGroup(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
    @Body() request: SetViewGroupRequest,
  ) {
    return this.setViewGroupHandler.execute(
      new SetViewGroupCommand(databaseId, viewId, request.propertyId ?? null),
    );
  }

  @Delete(':viewId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async deleteView(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
  ) {
    await this.deleteDatabaseViewHandler.execute(
      new DeleteDatabaseViewCommand(databaseId, viewId),
    );

    return {
      id: viewId,
    };
  }
}
