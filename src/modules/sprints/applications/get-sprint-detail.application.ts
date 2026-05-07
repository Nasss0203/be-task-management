import { Inject, Injectable } from '@nestjs/common';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  GetSprintDetailApplication,
  GetSprintDetailApplicationInput,
} from '../interfaces/applications/get-sprint-detail.application.interface';
import { type GetSprintDetailService } from '../interfaces/services/get-sprint-detail.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class GetSprintDetailApplicationImpl implements GetSprintDetailApplication {
  constructor(
    @Inject(SPRINT_TYPES.services.GetSprintDetailService)
    private readonly getSprintDetailService: GetSprintDetailService,
  ) {}

  async getSprintDetail(
    input: GetSprintDetailApplicationInput,
  ): Promise<SprintResponseDto> {
    const sprint = await this.getSprintDetailService.getSprintDetail(input);

    return SprintsMapper.toResponse(sprint);
  }
}
