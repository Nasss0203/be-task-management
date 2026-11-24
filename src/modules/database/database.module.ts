import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule as PersistenceDatabaseModule } from 'src/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';
import { CalendarFeedTokenService } from 'src/shared/security/calendar-feed-token.service';
import { AddPropertyOptionHandler } from './application/commands/add-property-option/add-property-option.handler';
import { AddPropertyHandler } from './application/commands/add-property/add-property.handler';
import { ClearRowValueHandler } from './application/commands/clear-row-value/clear-row-value.handler';
import { CreateDatabaseRowHandler } from './application/commands/create-database-row/create-database-row.handler';
import { ImportDatabaseRowsHandler } from './application/commands/import-database-rows/import-database-rows.handler';
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
import { SetViewPropertyWidthHandler } from './application/commands/set-view-property-width/set-view-property-width.handler';
import { RenameDatabaseHandler } from './application/commands/rename-database/rename-database.handler';
import { SetViewFiltersHandler } from './application/commands/set-view-filters/set-view-filters.handler';
import { SetViewGroupHandler } from './application/commands/set-view-group/set-view-group.handler';
import { ReorderViewPropertiesHandler } from './application/commands/reorder-view-properties/reorder-view-properties.handler';
import { GetDatabaseRowHandler } from './application/queries/get-database-row/get-database-row.handler';
import { ChangeDatabaseRowParentHandler } from './application/commands/change-database-row-parent/change-database-row-parent.handler';
import { MoveDatabaseRowHandler } from './application/commands/move-database-row/move-database-row.handler';
import { SetViewSortsHandler } from './application/commands/set-view-sorts/set-view-sorts.handler';
import { UpdatePropertyOptionHandler } from './application/commands/update-property-option/update-property-option.handler';
import { GetDatabaseRowsHandler } from './application/queries/get-database-rows/get-database-rows.handler';
import { GetDatabasePeopleHandler } from './application/queries/get-database-people/get-database-people.handler';
import { TypeOrmDatabasePeopleReader } from './infrastructure/persistence/typeorm/readers/typeorm-database-people.reader';
import { GetDatabaseViewHandler } from './application/queries/get-database-view/get-database-view.handler';
import { GetDatabaseViewsHandler } from './application/queries/get-database-views/get-database-views.handler';
import { GetDatabaseHandler } from './application/queries/get-database/get-database.handler';
import { UpsertCalendarFeedHandler } from './application/commands/upsert-calendar-feed/upsert-calendar-feed.handler';
import { RevokeCalendarFeedHandler } from './application/commands/revoke-calendar-feed/revoke-calendar-feed.handler';
import { GetMyCalendarFeedHandler } from './application/queries/get-my-calendar-feed/get-my-calendar-feed.handler';
import { GetCalendarFeedIcsHandler } from './application/queries/get-calendar-feed-ics/get-calendar-feed-ics.handler';
import { DatabaseProvisioningService } from './application/services/database-provisioning.service';
import { DatabaseSnapshotReaderService } from './application/services/database-snapshot-reader.service';
import { DATABASE_TYPES } from './database.types';
import { ActivityModule } from '../activity/activity.module';
import { ActivityDatabaseActivityRecorder } from './infrastructure/activity/database-activity.recorder';
import { EventEmitterDatabaseRowChangePublisher } from './infrastructure/events/event-emitter-database-row-change.publisher';
import { DatabasePropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseRowOrmEntity } from './infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { DatabaseViewPropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from './infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { DatabaseOrmEntity } from './infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from './infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { RowValueOrmEntity } from './infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { CalendarFeedOrmEntity } from './infrastructure/persistence/typeorm/entities/calendar-feed.orm-entity';
import { TypeOrmCalendarFeedRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-calendar-feed.repository';
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
import { CalendarFeedController } from './presentation/http/controllers/calendar-feed.controller';

@Module({
  imports: [
    PersistenceDatabaseModule,
    PermissionModule,
    forwardRef(() => ActivityModule),
    TypeOrmModule.forFeature([
      DatabaseOrmEntity,
      DatabasePropertyOrmEntity,
      PropertyOptionOrmEntity,
      DatabaseRowOrmEntity,
      RowValueOrmEntity,
      DatabaseViewOrmEntity,
      DatabaseViewPropertyOrmEntity,
      CalendarFeedOrmEntity,
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
    CalendarFeedController,
  ],

  providers: [
    CreateDatabaseHandler,
    AddPropertyHandler,
    AddPropertyOptionHandler,
    CreateDatabaseRowHandler,
    ImportDatabaseRowsHandler,
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
    SetViewPropertyWidthHandler,
    SetViewSortsHandler,
    SetViewFiltersHandler,
    RenameDatabaseHandler,
    SetViewGroupHandler,
    ReorderViewPropertiesHandler,
    MoveDatabaseRowHandler,
    ChangeDatabaseRowParentHandler,
    GetDatabaseRowHandler,
    GetDatabasePeopleHandler,
    UpsertCalendarFeedHandler,
    RevokeCalendarFeedHandler,
    GetMyCalendarFeedHandler,
    GetCalendarFeedIcsHandler,
    CalendarFeedTokenService,
    {
      provide: DATABASE_TYPES.ports.DatabasePeopleReader,
      useClass: TypeOrmDatabasePeopleReader,
    },
    {
      provide: DATABASE_TYPES.ports.DatabaseActivityRecorder,
      useClass: ActivityDatabaseActivityRecorder,
    },
    {
      provide: DATABASE_TYPES.ports.DatabaseRowChangePublisher,
      useClass: EventEmitterDatabaseRowChangePublisher,
    },
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
    {
      provide: DATABASE_TYPES.repositories.CalendarFeedRepository,
      useClass: TypeOrmCalendarFeedRepository,
    },
    {
      provide: DATABASE_TYPES.ports.DatabaseSnapshotReader,
      useClass: DatabaseSnapshotReaderService,
    },
    {
      provide: DATABASE_TYPES.ports.DatabaseProvisioning,
      useClass: DatabaseProvisioningService,
    },
  ],
  exports: [
    CreateDatabaseHandler,
    ImportDatabaseRowsHandler,
    AddPropertyHandler,
    AddPropertyOptionHandler,
    RenamePropertyHandler,
    CreateDatabaseViewHandler,
    CreateDatabaseRowHandler,
    SetRowValueHandler,

    GetDatabaseHandler,
    GetDatabaseRowsHandler,
    GetDatabaseViewHandler,
    GetDatabaseViewsHandler,

    DATABASE_TYPES.repositories.DatabaseRepository,
    DATABASE_TYPES.repositories.DatabaseRowRepository,

    DATABASE_TYPES.ports.DatabaseProvisioning,
    DATABASE_TYPES.ports.DatabaseSnapshotReader,
    DATABASE_TYPES.ports.DatabasePeopleReader,
  ],
})
export class DatabaseModule {}
