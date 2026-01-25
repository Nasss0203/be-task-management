// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_PORT'),
        password: config.get<string>('DB_PORT'),
        database: config.get<string>('DB_PORT'),
        autoLoadEntities: false,
        synchronize: true,
        migrationsRun: true,
        schema: 'public',
        logging: true,
        entities: [],
      }),
    }),
  ],
})
export class DatabaseModule {}
