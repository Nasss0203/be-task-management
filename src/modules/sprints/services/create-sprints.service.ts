import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type FindProjectRepository } from 'src/modules/projects/interfaces/repositories/find.project.repository.interface';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { EntityManager } from 'typeorm';
import { SprintsModel } from '../domain/models/sprints.model';
import { type CreateSprintRepository } from '../interfaces/repositories/create-sprint.repository.interface';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import {
  CreateSprintService,
  CreateSprintServiceInput,
} from '../interfaces/services/create-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class CreateSprintServiceImpl implements CreateSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.CreateSprintRepository)
    private readonly createSprintRepository: CreateSprintRepository,
    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(PROJECT_TYPES.repositories.FindProjectRepository)
    private readonly findProjectRepository: FindProjectRepository,
  ) {}

  async create(
    input: CreateSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel> {
    const projectId = input.projectId;

    const findProject =
      await this.findProjectRepository.findOneProjectById(projectId, manager);

    if (!findProject) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    if (findProject.workspace_id !== input.workspaceId) {
      throw new BadRequestException('Project does not belong to workspace');
    }

    const name =
      input.name?.trim() ||
      (await this.findSprintRepository.getNextDefaultSprintName(
        projectId,
        manager,
      ));

    const isSprintNameExists =
      await this.findSprintRepository.existsByProjectIdAndName(
        projectId,
        name,
        manager,
      );

    if (isSprintNameExists) {
      throw new ConflictException('Sprint name already exists in this project');
    }

    if (input.startAt && input.endAt && input.startAt >= input.endAt) {
      throw new BadRequestException('Sprint startAt must be before endAt');
    }

    return await this.createSprintRepository.save(
      {
        ...input,
        name,
      },
      manager,
    );
  }
}
