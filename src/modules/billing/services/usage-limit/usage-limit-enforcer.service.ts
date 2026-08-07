import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ErrorCode } from 'src/common/constants/error-code.constant';
import { UsageResourceType } from '../../domain/entities/usage-limit.entity';
import { type UsageLimitRepository } from '../../interfaces/repositories/usage-limit/usage-limit.repository.interface';
import { type UsageLimitEnforcerService } from '../../interfaces/services/usage-limit/usage-limit-enforcer.service.interface';
import { BILLING_TYPES } from '../../interfaces/types';

@Injectable()
export class UsageLimitEnforcerServiceImpl implements UsageLimitEnforcerService {
  constructor(
    @Inject(BILLING_TYPES.repositories.UsageLimitRepository)
    private readonly usageLimitRepository: UsageLimitRepository,
  ) {}

  async checkProjectLimit(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const usageLimit =
      await this.usageLimitRepository.findByWorkspaceAndResource(
        workspaceId,
        UsageResourceType.PROJECTS,
        manager,
      );

    if (!usageLimit) {
      throw new BadRequestException('Project usage limit not found');
    }

    if (usageLimit.limitValue === null) {
      return;
    }

    const currentProjectCount =
      await this.usageLimitRepository.countProjectsByWorkspaceId(
        workspaceId,
        manager,
      );

    if (currentProjectCount >= usageLimit.limitValue) {
      throw new BadRequestException({
        code: ErrorCode.PROJECT_LIMIT_EXCEEDED,
        message: `Project limit reached. Your plan allows up to ${usageLimit.limitValue} projects`,
      });
    }
  }

  async syncProjectUsedValue(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const usageLimit =
      await this.usageLimitRepository.findByWorkspaceAndResource(
        workspaceId,
        UsageResourceType.PROJECTS,
        manager,
      );

    if (!usageLimit) {
      return;
    }

    const currentProjectCount =
      await this.usageLimitRepository.countProjectsByWorkspaceId(
        workspaceId,
        manager,
      );

    usageLimit.usedValue = currentProjectCount;

    await this.usageLimitRepository.save(usageLimit, manager);
  }
}
