import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Sprint } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';

import {
  UpdateSprintRepository,
  UpdateSprintRepositoryInput,
} from '../interfaces/repositories/udpdate-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class UpdateSprintRepositoryImpl implements UpdateSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async updateSprint(
    input: UpdateSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const repo = this.getRepo(manager);

    const sprint = await repo.findOne({
      where: {
        id: input.id,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        deletedAt: IsNull(),
      },
    });

    if (!sprint) {
      return null;
    }

    if (input.name !== undefined) {
      sprint.name = input.name;
    }

    if (input.goal !== undefined) {
      sprint.goal = input.goal;
    }

    if (input.startAt !== undefined) {
      sprint.startAt = input.startAt;
    }

    if (input.endAt !== undefined) {
      sprint.endAt = input.endAt;
    }

    const saved = await repo.save(sprint);

    return SprintsMapper.toModel(saved);
  }
}
