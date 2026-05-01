import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import {
  CreateSprintRepository,
  SaveSprintInput,
} from '../interfaces/repositories/create-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CreateSprintRepositoryImpl implements CreateSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async save(
    input: SaveSprintInput,
    manager?: EntityManager,
  ): Promise<SprintsModel> {
    const repo = this.getRepo(manager);
    const entity = SprintsMapper.toEntity(input as SprintsModel);
    const saved = await repo.save(entity);
    return SprintsMapper.toModel(saved);
  }
}
