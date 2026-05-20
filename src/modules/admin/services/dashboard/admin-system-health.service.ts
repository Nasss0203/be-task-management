import { Inject, Injectable } from '@nestjs/common';
import { SystemHealthResponseDto } from '../../dto/response/dashboard/system-health.response.dto';
import { type AdminSystemHealthRepository } from '../../interfaces/repositories/dashboard/admin-system-health.repository.interface';
import { type AdminSystemHealthService } from '../../interfaces/services/dashboard/admin-system-health.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminSystemHealthServiceImpl implements AdminSystemHealthService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminSystemHealthRepository)
    private readonly repository: AdminSystemHealthRepository,
  ) {}

  getSystemHealth(): Promise<SystemHealthResponseDto[]> {
    return this.repository.getSystemHealth();
  }
}
