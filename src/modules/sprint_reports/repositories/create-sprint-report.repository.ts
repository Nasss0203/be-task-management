import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SprintReport } from '../domain/entities/sprint-report.entity';
import {
  CreateSprintReportData,
  CreateSprintReportRepository,
} from '../interfaces/repositories/create-sprint-report.repository.interface';
import { SprintReportsMapper } from '../mapper/sprint-reports.mapper';

@Injectable()
export class CreateSprintReportRepositoryImpl
  implements CreateSprintReportRepository
{
  constructor(
    @InjectRepository(SprintReport)
    private readonly repo: Repository<SprintReport>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<SprintReport> {
    return manager ? manager.getRepository(SprintReport) : this.repo;
  }

  async create(
    data: CreateSprintReportData,
    manager?: EntityManager,
  ): Promise<SprintReport> {
    const repo = this.getRepo(manager);
    const sprintReport = SprintReportsMapper.toEntity(data);
    return repo.save(sprintReport);
  }
}
