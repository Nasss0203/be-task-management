import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { AddPropertyOptionCommand } from 'src/modules/database/application/commands/add-property-option/add-property-option.command';
import { AddPropertyOptionHandler } from 'src/modules/database/application/commands/add-property-option/add-property-option.handler';
import { AddPropertyCommand } from 'src/modules/database/application/commands/add-property/add-property.command';
import { AddPropertyHandler } from 'src/modules/database/application/commands/add-property/add-property.handler';
import { DeletePropertyOptionCommand } from 'src/modules/database/application/commands/delete-property-option/delete-property-option.command';
import { DeletePropertyOptionHandler } from 'src/modules/database/application/commands/delete-property-option/delete-property-option.handler';
import { DeletePropertyCommand } from 'src/modules/database/application/commands/delete-property/delete-property.command';
import { DeletePropertyHandler } from 'src/modules/database/application/commands/delete-property/delete-property.handler';
import { RenamePropertyCommand } from 'src/modules/database/application/commands/rename-property/rename-property.command';
import { RenamePropertyHandler } from 'src/modules/database/application/commands/rename-property/rename-property.handler';
import { UpdatePropertyOptionCommand } from 'src/modules/database/application/commands/update-property-option/update-property-option.command';
import { UpdatePropertyOptionHandler } from 'src/modules/database/application/commands/update-property-option/update-property-option.handler';
import { AddPropertyOptionRequest } from '../requests/add-property-option.request';
import { AddPropertyRequest } from '../requests/add-property.request';
import { RenamePropertyRequest } from '../requests/rename-property.request';
import { UpdatePropertyOptionRequest } from '../requests/update-property-option.request';

@Controller('databases/:databaseId/properties')
export class DatabasePropertyController {
  constructor(
    private readonly addPropertyHandler: AddPropertyHandler,
    private readonly addPropertyOptionHandler: AddPropertyOptionHandler,
    private readonly renamePropertyHandler: RenamePropertyHandler,
    private readonly deletePropertyHandler: DeletePropertyHandler,
    private readonly updatePropertyOptionHandler: UpdatePropertyOptionHandler,
    private readonly deletePropertyOptionHandler: DeletePropertyOptionHandler,
  ) {}

  @Post()
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  async addProperty(
    @Auth() user: IAuth,
    @Param('databaseId') databaseId: string,
    @Body() request: AddPropertyRequest,
  ) {
    return await this.addPropertyHandler.execute(
      new AddPropertyCommand(databaseId, request.name, request.type, user.id),
    );
  }

  @Post(':propertyId/options')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  async addPropertyOption(
    @Auth() user: IAuth,
    @Param('databaseId') databaseId: string,
    @Param('propertyId') propertyId: string,
    @Body() request: AddPropertyOptionRequest,
  ) {
    const option = await this.addPropertyOptionHandler.execute(
      new AddPropertyOptionCommand(
        databaseId,
        propertyId,
        request.name,
        request.color ?? null,
        user.id,
      ),
    );

    return {
      id: option.getId(),
      name: option.getName(),
      color: option.getColor(),
      position: option.getPosition(),
    };
  }

  @Patch(':propertyId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async renameProperty(
    @Auth() user: IAuth,
    @Param('databaseId')
    databaseId: string,

    @Param('propertyId')
    propertyId: string,

    @Body()
    request: RenamePropertyRequest,
  ) {
    return this.renamePropertyHandler.execute(
      new RenamePropertyCommand(databaseId, propertyId, request.name, user.id),
    );
  }

  @Delete(':propertyId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async deleteProperty(
    @Auth() user: IAuth,
    @Param('databaseId')
    databaseId: string,
    @Param('propertyId')
    propertyId: string,
  ) {
    await this.deletePropertyHandler.execute(
      new DeletePropertyCommand(databaseId, propertyId, user.id),
    );

    return {
      id: propertyId,
    };
  }

  @Patch(':propertyId/options/:optionId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  async updatePropertyOption(
    @Auth() user: IAuth,
    @Param('databaseId')
    databaseId: string,

    @Param('propertyId')
    propertyId: string,

    @Param('optionId')
    optionId: string,

    @Body()
    request: UpdatePropertyOptionRequest,
  ) {
    return this.updatePropertyOptionHandler.execute(
      new UpdatePropertyOptionCommand(
        databaseId,
        propertyId,
        optionId,
        request.name,
        request.color ?? null,
        user.id,
      ),
    );
  }

  @Delete(':propertyId/options/:optionId')
  @WorkspaceContext({ source: 'resource', type: 'database', key: 'databaseId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async deletePropertyOption(
    @Auth() user: IAuth,
    @Param('databaseId')
    databaseId: string,

    @Param('propertyId')
    propertyId: string,

    @Param('optionId')
    optionId: string,
  ) {
    await this.deletePropertyOptionHandler.execute(
      new DeletePropertyOptionCommand(
        databaseId,
        propertyId,
        optionId,
        user.id,
      ),
    );

    return {
      id: optionId,
    };
  }
}
