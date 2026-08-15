import { Body, Controller, Param, Post } from '@nestjs/common';

import { AddPropertyOptionCommand } from 'src/modules/database/application/commands/add-property-option/add-property-option.command';
import { AddPropertyOptionHandler } from 'src/modules/database/application/commands/add-property-option/add-property-option.handler';
import { AddPropertyCommand } from 'src/modules/database/application/commands/add-property/add-property.command';
import { AddPropertyHandler } from 'src/modules/database/application/commands/add-property/add-property.handler';
import { AddPropertyOptionRequest } from '../requests/add-property-option.request';
import { AddPropertyRequest } from '../requests/add-property.request';

@Controller('databases/:databaseId/properties')
export class DatabasePropertyController {
  constructor(
    private readonly addPropertyHandler: AddPropertyHandler,
    private readonly addPropertyOptionHandler: AddPropertyOptionHandler,
  ) {}

  @Post()
  async addProperty(
    @Param('databaseId') databaseId: string,
    @Body() request: AddPropertyRequest,
  ) {
    const property = await this.addPropertyHandler.execute(
      new AddPropertyCommand(databaseId, request.name, request.type),
    );

    return {
      id: property.getId(),
      databaseId: property.getDatabaseId(),
      name: property.getName(),
      type: property.getType(),
      position: property.getPosition(),
      options: property.getOptions(),
    };
  }

  @Post(':propertyId/options')
  async addPropertyOption(
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
      ),
    );

    return {
      id: option.getId(),
      name: option.getName(),
      color: option.getColor(),
      position: option.getPosition(),
    };
  }
}
