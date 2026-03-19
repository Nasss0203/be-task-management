import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProjectModel } from '../domain/models/projects.model';
import { CreateProjectDto } from '../dto/create-project.dto';
import { type CreateProjectRepository } from '../interfaces/repositories/create.project.repository.interface';
import { CreateProjectService } from '../interfaces/services/create.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class CreateProjectServiceImpl implements CreateProjectService {
  constructor(
    @Inject(PROJECT_TYPES.repositories.CreateProjectRepository)
    private readonly repo: CreateProjectRepository,
  ) {}
  create(
    createProjectDto: CreateProjectDto,
    manager: EntityManager,
  ): Promise<ProjectModel> {
    const create = this.repo.save(createProjectDto, manager);
    return create;
  }
}
