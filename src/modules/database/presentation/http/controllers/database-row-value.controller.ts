import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';

import { ClearRowValueCommand } from 'src/modules/database/application/commands/clear-row-value/clear-row-value.command';
import { ClearRowValueHandler } from 'src/modules/database/application/commands/clear-row-value/clear-row-value.handler';
import { SetRowValueCommand } from 'src/modules/database/application/commands/set-row-value/set-row-value.command';
import { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';
import { SetRowValueRequest } from '../requests/set-row-value.request';

@Controller('database-rows/:rowId/values')
export class DatabaseRowValueController {
  constructor(
    private readonly setRowValueHandler: SetRowValueHandler,
    private readonly clearRowValueHandler: ClearRowValueHandler,
  ) {}

  @Patch(':propertyId')
  async setValue(
    @Param('rowId') rowId: string,
    @Param('propertyId') propertyId: string,
    @Body() request: SetRowValueRequest,
  ) {
    const value = await this.setRowValueHandler.execute(
      new SetRowValueCommand(rowId, propertyId, request.value),
    );

    return {
      id: value.getId(),
      rowId: value.getRowId(),
      propertyId: value.getPropertyId(),
      value: value.getValue(),
    };
  }

  @Delete(':propertyId')
  async clearValue(
    @Param('rowId') rowId: string,
    @Param('propertyId') propertyId: string,
  ) {
    await this.clearRowValueHandler.execute(
      new ClearRowValueCommand(rowId, propertyId),
    );

    return {
      rowId,
      propertyId,
    };
  }
}
