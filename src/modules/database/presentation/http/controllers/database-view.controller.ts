import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateDatabaseViewCommand } from '../../../application/commands/create-database-view/create-database-view.command';
import { CreateDatabaseViewHandler } from '../../../application/commands/create-database-view/create-database-view.handler';

import { DeleteDatabaseViewCommand } from 'src/modules/database/application/commands/delete-database-view/delete-database-view.command';
import { DeleteDatabaseViewHandler } from 'src/modules/database/application/commands/delete-database-view/delete-database-view.handler';
import { RenameDatabaseViewCommand } from 'src/modules/database/application/commands/rename-database-view/rename-database-view.command';
import { RenameDatabaseViewHandler } from 'src/modules/database/application/commands/rename-database-view/rename-database-view.handler';
import { SetViewPropertyVisibilityCommand } from 'src/modules/database/application/commands/set-view-property-visibility/set-view-property-visibility.command';
import { SetViewPropertyVisibilityHandler } from 'src/modules/database/application/commands/set-view-property-visibility/set-view-property-visibility.handler';
import { GetDatabaseViewHandler } from 'src/modules/database/application/queries/get-database-view/get-database-view.handler';
import { GetDatabaseViewQuery } from 'src/modules/database/application/queries/get-database-view/get-database-view.query';
import { GetDatabaseViewsHandler } from 'src/modules/database/application/queries/get-database-views/get-database-views.handler';
import { GetDatabaseViewsQuery } from 'src/modules/database/application/queries/get-database-views/get-database-views.query';
import { CreateDatabaseViewRequest } from '../requests/create-database-view.request';
import { RenameDatabaseViewRequest } from '../requests/rename-database-view.request';
import { SetViewPropertyVisibilityRequest } from '../requests/set-view-property-visibility.request';

@Controller('databases/:databaseId/views')
export class DatabaseViewController {
  constructor(
    private readonly createDatabaseViewHandler: CreateDatabaseViewHandler,
    private readonly deleteDatabaseViewHandler: DeleteDatabaseViewHandler,
    private readonly getDatabaseViewsHandler: GetDatabaseViewsHandler,
    private readonly renameDatabaseViewHandler: RenameDatabaseViewHandler,
    private readonly getDatabaseViewHandler: GetDatabaseViewHandler,
    private readonly setViewPropertyVisibilityHandler: SetViewPropertyVisibilityHandler,
  ) {}

  @Post()
  async createView(
    @Param('databaseId') databaseId: string,
    @Body() request: CreateDatabaseViewRequest,
  ) {
    return this.createDatabaseViewHandler.execute(
      new CreateDatabaseViewCommand(databaseId, request.name, request.type),
    );
  }

  @Get()
  async getViews(@Param('databaseId') databaseId: string) {
    return this.getDatabaseViewsHandler.execute(
      new GetDatabaseViewsQuery(databaseId),
    );
  }

  @Get(':viewId')
  async getView(
    @Param('databaseId') databaseId: string,
    @Param('viewId') viewId: string,
  ) {
    return this.getDatabaseViewHandler.execute(
      new GetDatabaseViewQuery(databaseId, viewId),
    );
  }

  @Patch(':viewId')
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

  @Delete(':viewId')
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
