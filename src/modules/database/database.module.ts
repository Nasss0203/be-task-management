import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddPropertyOptionHandler } from './application/commands/add-property-option/add-property-option.handler';
import { AddPropertyHandler } from './application/commands/add-property/add-property.handler';
import { CreateDatabaseHandler } from './application/commands/create-database/create-database.handler';
import { DATABASE_TYPES } from './database.types';
import { DatabasePropertyOrmEntity } from './infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { DatabaseOrmEntity } from './infrastructure/persistence/typeorm/entities/database.orm-entity';
import { PropertyOptionOrmEntity } from './infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { TypeOrmDatabaseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-database.repository';
import { DatabasePropertyController } from './presentation/http/controllers/database-property.controller';
import { DatabaseController } from './presentation/http/controllers/database.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatabaseOrmEntity,
      DatabasePropertyOrmEntity,
      PropertyOptionOrmEntity,
    ]),
  ],
  controllers: [DatabaseController, DatabasePropertyController],

  providers: [
    CreateDatabaseHandler,
    AddPropertyHandler,
    AddPropertyOptionHandler,
    {
      provide: DATABASE_TYPES.repositories.DatabaseRepository,
      useClass: TypeOrmDatabaseRepository,
    },
  ],
  exports: [],
})
export class DatabaseModule {}
