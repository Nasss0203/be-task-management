import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { EntityManager, Repository } from 'typeorm';

import {
  UsageLimit,
  UsageResourceType,
} from '../../domain/entities/usage-limit.entity';
import { type UsageLimitRepository } from '../../interfaces/repositories/usage-limit/usage-limit.repository.interface';

@Injectable()
export class UsageLimitRepositoryImpl implements UsageLimitRepository {
  constructor(
    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  private getUsageLimitRepository(
    manager?: EntityManager,
  ): Repository<UsageLimit> {
    return manager?.getRepository(UsageLimit) ?? this.usageLimitRepository;
  }

  private getProjectRepository(manager?: EntityManager): Repository<Project> {
    return manager?.getRepository(Project) ?? this.projectRepository;
  }

  findByWorkspaceAndResource(
    workspaceId: string,
    resourceType: UsageResourceType,
    manager?: EntityManager,
  ): Promise<UsageLimit | null> {
    return this.getUsageLimitRepository(manager).findOne({
      where: {
        workspaceId,
        resourceType,
      },
    });
  }

  save(usageLimit: UsageLimit, manager?: EntityManager): Promise<UsageLimit> {
    return this.getUsageLimitRepository(manager).save(usageLimit);
  }

  countProjectsByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getProjectRepository(manager).count({
      where: {
        workspace_id: workspaceId,
      },
    });
  }
}
