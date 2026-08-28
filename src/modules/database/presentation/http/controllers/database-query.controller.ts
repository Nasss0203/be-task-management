import { Controller, Get, Param } from '@nestjs/common';

import { GetDatabaseHandler } from 'src/modules/database/application/queries/get-database/get-database.handler';
import { GetDatabaseQuery } from 'src/modules/database/application/queries/get-database/get-database.query';

@Controller('databases')
export class DatabaseQueryController {
  constructor(private readonly getDatabaseHandler: GetDatabaseHandler) {}

  @Get(':databaseId')
  async getDatabase(@Param('databaseId') databaseId: string) {
    const database = await this.getDatabaseHandler.execute(
      new GetDatabaseQuery(databaseId),
    );

    return {
      id: database.getId(),
      pageId: database.getPageId(),
      name: database.getName(),

      properties: database.getProperties().map((property) => ({
        id: property.getId(),
        name: property.getName(),
        type: property.getType(),
        isDefault: property.getIsDefault(),
        position: property.getPosition(),

        options: property.getOptions().map((option) => ({
          id: option.getId(),
          name: option.getName(),
          color: option.getColor(),
          position: option.getPosition(),
        })),
      })),
    };
  }
}
