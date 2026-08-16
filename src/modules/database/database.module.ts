import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddPropertyOptionHandler } from './application/commands/add-property-option/add-property-option.handler';
import { AddPropertyHandler } from './application/commands/add-property/add-property.handler';
import { ClearRowValueHandler } from './application/commands/clear-row-value/clear-row-value.handler';
import { CreateDatabaseRowHandler } from './application/commands/create-database-row/create-database-row.handler';
import { CreateDatabaseHandler } from './application/commands/create-database/create-database.handler';
import { DeleteDatabaseRowHandler } from './application/commands/delete-database-row/delete-database-row.handler';
import { DeletePropertyOptionHandler } from './application/commands/delete-property-option/delete-property-option.handler';
import { DeletePropertyHandler } from './application/commands/delete-property/delete-property.handler';
import { RenamePropertyHandler } from './application/commands/rename-property/rename-property.handler';
import { SetRowValueHandler } from './application/commands/set-row-value/set-row-value.handler';
import { UpdatePropertyOptionHandler } from './application/commands/update-property-option/update-property-option.handler';
import { GetDatabaseRowsHandler } from './application/queries/get-database-rows/get-database-rows.handler';
import { GetDatabaseHandler } from './application/queries/get-database/get-database.handler';
import { DATABASE_TYPES } from './database.types';
import { DatabasePropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from './infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseOrmEntity } from './infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from './infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from './infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { TypeOrmDatabaseRowRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-database-row.repository';
import { TypeOrmDatabaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-database.repository';
import { DatabasePropertyController } from './presentation/http/controllers/database-property.controller';
import { DatabaseQueryController } from './presentation/http/controllers/database-query.controller';
import { DatabaseRowResourceController } from './presentation/http/controllers/database-row-resource.controller';
import { DatabaseRowValueController } from './presentation/http/controllers/database-row-value.controller';
import { DatabaseRowController } from './presentation/http/controllers/database-row.controller';
import { DatabaseController } from './presentation/http/controllers/database.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatabaseOrmEntity,
      DatabasePropertyOrmEntity,
      PropertyOptionOrmEntity,
      DatabaseRowOrmEntity,
      RowValueOrmEntity,
    ]),
  ],
  controllers: [
    DatabaseController,
    DatabasePropertyController,
    DatabaseRowController,
    DatabaseRowValueController,
    DatabaseQueryController,
    DatabaseRowResourceController,
  ],

  providers: [
    CreateDatabaseHandler,
    AddPropertyHandler,
    AddPropertyOptionHandler,
    CreateDatabaseRowHandler,
    SetRowValueHandler,
    GetDatabaseRowsHandler,
    GetDatabaseHandler,
    DeleteDatabaseRowHandler,
    ClearRowValueHandler,
    RenamePropertyHandler,
    DeletePropertyHandler,
    UpdatePropertyOptionHandler,
    DeletePropertyOptionHandler,
    {
      provide: DATABASE_TYPES.repositories.DatabaseRepository,
      useClass: TypeOrmDatabaseRepository,
    },
    {
      provide: DATABASE_TYPES.repositories.DatabaseRowRepository,
      useClass: TypeOrmDatabaseRowRepository,
    },
  ],
  exports: [],
})
export class DatabaseModule {}
