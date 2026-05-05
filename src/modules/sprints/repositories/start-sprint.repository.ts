import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint, SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { StartSprintRepository } from '../interfaces/repositories/start-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class StartSprintRepositoryImpl implements StartSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async startSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const repo = this.getRepo(manager);

    const sprint = await repo.findOne({
      where: {
        id: sprintId,
      },
    });

    if (!sprint) {
      return null;
    }

    sprint.status = SprintStatus.ACTIVE;
    sprint.startAt = sprint.startAt ?? new Date();

    const saved = await repo.save(sprint);

    return SprintsMapper.toModel(saved);
  }
}
