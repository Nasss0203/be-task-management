import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindSprintReportsApplicationImpl } from './applications/find-sprint-reports.application';
import { SprintReportsController } from './controller/sprint-reports.controller';
import { SprintReport } from './domain/entities/sprint-report.entity';
import { SPRINT_REPORT_TYPES } from './interfaces/types';
import { CreateSprintReportRepositoryImpl } from './repositories/create-sprint-report.repository';
import { FindSprintReportsRepositoryImpl } from './repositories/find-sprint-reports.repository';
import { FindSprintReportsServiceImpl } from './services/find-sprint-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([SprintReport])],
  controllers: [SprintReportsController],
  providers: [
    // Applications
    {
      provide: SPRINT_REPORT_TYPES.applications.FindSprintReportsApplication,
      useClass: FindSprintReportsApplicationImpl,
    },
    // Services
    {
      provide: SPRINT_REPORT_TYPES.services.FindSprintReportsService,
      useClass: FindSprintReportsServiceImpl,
    },
    // Repositories
    {
      provide: SPRINT_REPORT_TYPES.repositories.CreateSprintReportRepository,
      useClass: CreateSprintReportRepositoryImpl,
    },
    {
      provide: SPRINT_REPORT_TYPES.repositories.FindSprintReportsRepository,
      useClass: FindSprintReportsRepositoryImpl,
    },
  ],
  exports: [
    SPRINT_REPORT_TYPES.repositories.CreateSprintReportRepository,
    SPRINT_REPORT_TYPES.repositories.FindSprintReportsRepository,
  ],
})
export class SprintReportsModule {}
