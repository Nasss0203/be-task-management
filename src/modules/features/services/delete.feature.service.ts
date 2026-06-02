import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type FindFeatureService } from '../interfaces/services/find.feature.service.interface';
import { DeleteFeatureService } from '../interfaces/services/delete.feature.service.interface';
import { type DeleteFeatureRepository } from '../interfaces/repositories/delete.feature.repository.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteFeatureServiceImpl implements DeleteFeatureService {
  constructor(
    @Inject(FEATURE_TYPES.services.FindFeatureService)
    private readonly findFeatureService: FindFeatureService,

    @Inject(FEATURE_TYPES.repositories.DeleteFeatureRepository)
    private readonly repo: DeleteFeatureRepository,
  ) {}

  async delete(id: string, manager?: EntityManager): Promise<void> {
    await this.findFeatureService.findById(id, manager);
    await this.repo.softDelete(id, manager);
  }
}
