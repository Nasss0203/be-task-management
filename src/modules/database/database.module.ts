import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddPropertyOptionHandler } from './application/commands/add-property-option/add-property-option.handler';
import { AddPropertyHandler } from './application/commands/add-property/add-property.handler';
import { ClearRowValueHandler } from './application/commands/clear-row-value/clear-row-value.handler';
import { CreateDatabaseRowHandler } from './application/commands/create-database-row/create-database-row.handler';
import { CreateDatabaseViewHandler } from './application/commands/create-database-view/create-database-view.handler';
import { CreateDatabaseHandler } from './application/commands/create-database/create-database.handler';
import { DeleteDatabaseRowHandler } from './application/commands/delete-database-row/delete-database-row.handler';
import { DeleteDatabaseViewHandler } from './application/commands/delete-database-view/delete-database-view.handler';
import { DeletePropertyOptionHandler } from './application/commands/delete-property-option/delete-property-option.handler';
import { DeletePropertyHandler } from './application/commands/delete-property/delete-property.handler';
import { RenameDatabaseViewHandler } from './application/commands/rename-database-view/rename-database-view.handler';
import { RenamePropertyHandler } from './application/commands/rename-property/rename-property.handler';
import { SetRowValueHandler } from './application/commands/set-row-value/set-row-value.handler';
import { SetViewPropertyVisibilityHandler } from './application/commands/set-view-property-visibility/set-view-property-visibility.handler';
import { UpdatePropertyOptionHandler } from './application/commands/update-property-option/update-property-option.handler';
import { GetDatabaseViewHandler } from './application/queries/get-database-view/get-database-view.handler';
import { GetDatabaseRowsHandler } from './application/queries/get-database-rows/get-database-rows.handler';
import { GetDatabaseViewsHandler } from './application/queries/get-database-views/get-database-views.handler';
import { GetDatabaseHandler } from './application/queries/get-database/get-database.handler';
import { DATABASE_TYPES } from './database.types';
import { DatabasePropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from './infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseViewPropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from './infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { DatabaseOrmEntity } from './infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from './infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from './infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { TypeOrmDatabaseRowRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-database-row.repository';
import { TypeOrmDatabaseViewRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-database-view.repository';
import { TypeOrmDatabaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-database.repository';
import { DatabasePropertyController } from './presentation/http/controllers/database-property.controller';
import { DatabaseQueryController } from './presentation/http/controllers/database-query.controller';
import { DatabaseRowResourceController } from './presentation/http/controllers/database-row-resource.controller';
import { DatabaseRowValueController } from './presentation/http/controllers/database-row-value.controller';
import { DatabaseRowController } from './presentation/http/controllers/database-row.controller';
import { DatabaseViewController } from './presentation/http/controllers/database-view.controller';
import { DatabaseController } from './presentation/http/controllers/database.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatabaseOrmEntity,
      DatabasePropertyOrmEntity,
      PropertyOptionOrmEntity,
      DatabaseRowOrmEntity,
      RowValueOrmEntity,
      DatabaseViewOrmEntity,
      DatabaseViewPropertyOrmEntity,
    ]),
  ],
  controllers: [
    DatabaseController,
    DatabasePropertyController,
    DatabaseRowController,
    DatabaseRowValueController,
    DatabaseQueryController,
    DatabaseRowResourceController,
    DatabaseViewController,
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
    CreateDatabaseViewHandler,
    GetDatabaseViewsHandler,
    RenameDatabaseViewHandler,
    DeleteDatabaseViewHandler,
    GetDatabaseViewHandler,
    SetViewPropertyVisibilityHandler,
    {
      provide: DATABASE_TYPES.repositories.DatabaseRepository,
      useClass: TypeOrmDatabaseRepository,
    },
    {
      provide: DATABASE_TYPES.repositories.DatabaseRowRepository,
      useClass: TypeOrmDatabaseRowRepository,
    },
    {
      provide: DATABASE_TYPES.repositories.DatabaseViewRepository,
      useClass: TypeOrmDatabaseViewRepository,
    },
  ],
  exports: [],
})
export class DatabaseModule {}
