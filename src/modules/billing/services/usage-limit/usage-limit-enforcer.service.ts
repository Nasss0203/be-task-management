import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { EntityManager, Repository } from 'typeorm';

import {
  UsageLimit,
  UsageResourceType,
} from '../../domain/entities/usage-limit.entity';

@Injectable()
export class UsageLimitEnforcerService {
  constructor(
    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async checkProjectLimit(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const usageLimitRepository = this.getUsageLimitRepository(manager);
    const projectRepository = this.getProjectRepository(manager);

    const usageLimit = await usageLimitRepository.findOne({
      where: {
        workspaceId,
        resourceType: UsageResourceType.PROJECTS,
      },
    });

    if (!usageLimit) {
      throw new BadRequestException('Project usage limit not found');
    }

    if (usageLimit.limitValue === null) {
      return;
    }

    const currentProjectCount = await projectRepository.count({
      where: {
        workspace_id: workspaceId,
      },
    });

    if (currentProjectCount >= usageLimit.limitValue) {
      throw new BadRequestException(
        `Project limit reached. Your plan allows up to ${usageLimit.limitValue} projects`,
      );
    }
  }

  async syncProjectUsedValue(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const usageLimitRepository = this.getUsageLimitRepository(manager);
    const projectRepository = this.getProjectRepository(manager);

    const usageLimit = await usageLimitRepository.findOne({
      where: {
        workspaceId,
        resourceType: UsageResourceType.PROJECTS,
      },
    });

    if (!usageLimit) {
      return;
    }

    const currentProjectCount = await projectRepository.count({
      where: {
        workspace_id: workspaceId,
      },
    });

    usageLimit.usedValue = currentProjectCount;

    await usageLimitRepository.save(usageLimit);
  }

  private getUsageLimitRepository(
    manager?: EntityManager,
  ): Repository<UsageLimit> {
    return manager?.getRepository(UsageLimit) ?? this.usageLimitRepository;
  }

  private getProjectRepository(manager?: EntityManager): Repository<Project> {
    return manager?.getRepository(Project) ?? this.projectRepository;
  }
}
