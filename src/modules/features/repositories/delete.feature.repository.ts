import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Feature } from '../domain/entities/feature.entity';
import { DeleteFeatureRepository } from '../interfaces/repositories/delete.feature.repository.interface';

@Injectable()
export class DeleteFeatureRepositoryImpl implements DeleteFeatureRepository {
  constructor(
    @InjectRepository(Feature)
    private readonly repo: Repository<Feature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Feature> {
    return manager ? manager.getRepository(Feature) : this.repo;
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).softDelete(id);
  }
}
