import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint } from '../domain/entities/sprint.entity';
import { DeleteSprintRepository } from '../interfaces/repositories/delete-sprint.repository.interface';

@Injectable()
export class DeleteSprintRepositoryImpl implements DeleteSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async softDeleteSprint(
    input: {
      sprintId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.sprintId },
      {
        deletedAt: new Date(),
        deletedBy: input.deletedBy,
      },
    );
  }

  async restoreSprint(
    input: {
      sprintId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.sprintId },
      {
        deletedAt: null,
        deletedBy: null,
      },
    );
  }
}
