import { Inject, Injectable } from '@nestjs/common';
import {
  FindActivityFilters,
  FindActivityResult,
  type FindActivityRepository,
} from '../interfaces/repositories/find-activity.repository.interface';
import { FindActivityService } from '../interfaces/services/find-activity.service.interface';
import { ACTIVITY_TYPES } from '../interfaces/types';

@Injectable()
export class FindActivityServiceImpl implements FindActivityService {
  constructor(
    @Inject(ACTIVITY_TYPES.repositories.FindActivityRepository)
    private readonly findActivityRepository: FindActivityRepository,
  ) {}

  findMany(filters: FindActivityFilters): Promise<FindActivityResult> {
    return this.findActivityRepository.findMany(filters);
  }
}
