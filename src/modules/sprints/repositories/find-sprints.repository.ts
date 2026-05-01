import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class FindSprintRepositoryImpl implements FindSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async existsByProjectIdAndName(
    projectId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return await this.getRepo(manager).exists({
      where: {
        projectId,
        name,
      },
    });
  }

  async findOneSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    return await this.getRepo(manager).findOne({
      where: {
        id: sprintId,
      },
    });
  }

  async findAllSprintByProject(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel[]> {
    const repo = this.getRepo(manager);

    const sprints = await repo.find({
      where: {
        workspaceId,
        projectId,
      },
      order: {
        startAt: 'ASC',
        createdAt: 'ASC',
      },
    });

    return sprints.map(SprintsMapper.toModel);
  }
}
