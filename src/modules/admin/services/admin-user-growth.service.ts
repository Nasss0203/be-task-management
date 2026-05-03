import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserGrowthQueryDto } from '../dto/query/user-growth-query.dto';
import { UserGrowthResponseDto } from '../dto/response/user-growth.response.dto';
import { type AdminUserGrowthRepository } from '../interfaces/repositories/admin-user-growth.repository.interface';
import { AdminUserGrowthService } from '../interfaces/services/admin-user-growth.service.interface';
import { ADMIN_TYPES } from '../interfaces/types';

@Injectable()
export class AdminUserGrowthServiceImpl implements AdminUserGrowthService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminUserGrowthRepository)
    private readonly repository: AdminUserGrowthRepository,
  ) {}

  getUserGrowth(
    query: UserGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<UserGrowthResponseDto[]> {
    return this.repository.getUserGrowth(query, manager);
  }
}
