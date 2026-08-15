import { Body, Controller, Param, Post } from '@nestjs/common';

import { CreateDatabaseCommand } from 'src/modules/database/application/commands/create-database/create-database.command';
import { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import { CreateDatabaseRequest } from '../requests/create-database.request';

@Controller('pages/:pageId/databases')
export class DatabaseController {
  constructor(private readonly createDatabaseHandler: CreateDatabaseHandler) {}

  @Post()
  async createDatabase(
    @Param('pageId') pageId: string,
    @Body() request: CreateDatabaseRequest,
  ) {
    const database = await this.createDatabaseHandler.execute(
      new CreateDatabaseCommand(pageId, request.name),
    );

    return {
      id: database.getId(),
      pageId: database.getPageId(),
      name: database.getName(),
      properties: database.getProperties().map((property) => ({
        id: property.getId(),
        name: property.getName(),
        type: property.getType(),
        position: property.getPosition(),
      })),
    };
  }
}
