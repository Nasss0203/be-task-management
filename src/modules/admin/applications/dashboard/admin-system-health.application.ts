import { Inject, Injectable } from '@nestjs/common';
import { SystemHealthResponseDto } from '../../dto/response/dashboard/system-health.response.dto';
import { type AdminSystemHealthApplication } from '../../interfaces/applications/dashboard/admin-system-health.application.interface';
import { type AdminSystemHealthService } from '../../interfaces/services/dashboard/admin-system-health.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminSystemHealthApplicationImpl implements AdminSystemHealthApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminSystemHealthService)
    private readonly service: AdminSystemHealthService,
  ) {}

  getSystemHealth(): Promise<SystemHealthResponseDto[]> {
    return this.service.getSystemHealth();
  }
}
