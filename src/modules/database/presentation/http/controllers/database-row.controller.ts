import { Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import { GetDatabaseRowsHandler } from 'src/modules/database/application/queries/get-database-rows/get-database-rows.handler';
import { GetDatabaseRowsQuery } from 'src/modules/database/application/queries/get-database-rows/get-database-rows.query';

@Controller('databases/:databaseId/rows')
export class DatabaseRowController {
  constructor(
    private readonly createDatabaseRowHandler: CreateDatabaseRowHandler,
    private readonly getDatabaseRowsHandler: GetDatabaseRowsHandler,
  ) {}

  @Post()
  async createRow(@Param('databaseId') databaseId: string) {
    const row = await this.createDatabaseRowHandler.execute(
      new CreateDatabaseRowCommand(databaseId),
    );

    return {
      id: row.getId(),
      databaseId: row.getDatabaseId(),
      values: row.getValues(),
    };
  }

  @Get()
  async getRows(@Param('databaseId') databaseId: string) {
    const rows = await this.getDatabaseRowsHandler.execute(
      new GetDatabaseRowsQuery(databaseId),
    );

    return rows.map((row) => ({
      id: row.getId(),
      databaseId: row.getDatabaseId(),

      values: row.getValues().map((value) => ({
        id: value.getId(),
        propertyId: value.getPropertyId(),
        value: value.getValue(),
      })),
    }));
  }
}
