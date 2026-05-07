import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import { type StartSprintRepository } from '../interfaces/repositories/start-sprint.repository.interface';
import {
  StartSprintService,
  StartSprintServiceInput,
} from '../interfaces/services/start-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class StartSprintServiceImpl implements StartSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.StartSprintRepository)
    private readonly startSprintRepository: StartSprintRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,
  ) {}
  async startSprint(
    input: StartSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel> {
    const sprint = await this.findSprintRepository.findOneSprint(
      input.sprintId,
      manager,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.status !== SprintStatus.PLANNED) {
      throw new BadRequestException('Only planned sprint can be started');
    }

    // Todo: Chưa làm
    // const activeSprint =
    //   await this.findSprintRepository.findActiveSprintInProject(
    //     input.workspaceId,
    //     input.projectId,
    //     manager,
    //   );

    // if (activeSprint) {
    //   throw new BadRequestException('Project already has an active sprint');
    // }

    const startedSprint = await this.startSprintRepository.startSprint(
      input.sprintId,
      manager,
    );

    if (!startedSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return startedSprint;
  }
}
