import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint, SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import {
  StartSprintRepository,
  StartSprintRepositoryInput,
} from '../interfaces/repositories/start-sprint.repository.interface';
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
    input: StartSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const repo = this.getRepo(manager);

    const sprint = await repo.findOne({
      where: {
        id: input.sprintId,
      },
    });

    if (!sprint) {
      return null;
    }

    sprint.status = SprintStatus.ACTIVE;
    sprint.startAt = input.startAt;

    if (input.endAt !== undefined) {
      sprint.endAt = input.endAt;
    }

    if (input.name !== undefined) {
      sprint.name = input.name;
    }

    if (input.goal !== undefined) {
      sprint.goal = input.goal;
    }

    const saved = await repo.save(sprint);

    return SprintsMapper.toModel(saved);
  }
}
