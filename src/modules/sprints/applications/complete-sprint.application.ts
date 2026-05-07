import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  CompleteSprintApplication,
  CompleteSprintApplicationInput,
} from '../interfaces/applications/complete-sprint.application.interface';
import { type CompleteSprintService } from '../interfaces/services/complete-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CompleteSprintApplicationImpl implements CompleteSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.CompleteSprintService)
    private readonly completeSprintService: CompleteSprintService,

    @Inject(SPRINT_TYPES.uow.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async complete(
    input: CompleteSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const sprint = await this.unitOfWork.runInTransaction(async (manager) => {
      const sprint = this.completeSprintService.completeSprint(
        {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          sprintId: input.sprintId,
        },
        manager,
      );

      return sprint;
    });

    return SprintsMapper.toResponse(sprint);
  }
}
