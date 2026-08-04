import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SprintReport } from '../domain/entities/sprint-report.entity';
import { FindSprintReportsRepository } from '../interfaces/repositories/find-sprint-reports.repository.interface';

@Injectable()
export class FindSprintReportsRepositoryImpl implements FindSprintReportsRepository {
  constructor(
    @InjectRepository(SprintReport)
    private readonly repo: Repository<SprintReport>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<SprintReport> {
    return manager ? manager.getRepository(SprintReport) : this.repo;
  }

  async findReportsByProjectId(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<SprintReport[]> {
    const repo = this.getRepo(manager);
    return repo.find({
      where: { workspaceId, projectId },
      order: { completedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findReportBySprintId(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintReport | null> {
    const repo = this.getRepo(manager);
    return repo.findOne({
      where: { workspaceId, projectId, sprintId },
    });
  }
}
