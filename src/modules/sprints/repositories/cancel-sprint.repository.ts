import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint, SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { CancelSprintRepository } from '../interfaces/repositories/cancel-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CancelSprintRepositoryImpl implements CancelSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async cancelSprint(
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

    sprint.status = SprintStatus.CANCELLED;

    const saved = await repo.save(sprint);

    return SprintsMapper.toModel(saved);
  }
}
