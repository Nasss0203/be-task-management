import { Inject, Injectable } from '@nestjs/common';
import {
  FindActivityFilters,
  FindActivityResult,
  type FindActivityRepository,
} from '../../domain/repositories/find-activity.repository';
import { FindActivityService } from '../ports/find-activity.service.port';
import { ACTIVITY_TYPES } from '../../activity.types';

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
