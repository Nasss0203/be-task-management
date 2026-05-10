import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Repository } from 'typeorm';
import { WorkspacePlanResponseDto } from '../../dto/response/dashboard/workspace-plan.response.dto';
import { AdminWorkspacePlanRepository } from '../../interfaces/repositories/dashboard/admin-workspace-plan.repository.interface';

type WorkspacePlanRaw = {
  name: string;
  value: string;
};

@Injectable()
export class AdminWorkspacePlanRepositoryImpl implements AdminWorkspacePlanRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  async getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]> {
    const rows = await this.repo
      .createQueryBuilder('workspace')
      .select(`workspace.plan_type`, 'name')
      .addSelect(`COUNT(workspace.id)`, 'value')
      .where(`workspace.deleted_at IS NULL`)
      .groupBy(`workspace.plan_type`)
      .orderBy(`workspace.plan_type`, 'ASC')
      .getRawMany<WorkspacePlanRaw>();

    const rowMap = new Map(
      rows.map((row) => [row.name.toLowerCase(), Number(row.value)]),
    );

    return [
      {
        name: 'Free',
        value: rowMap.get('free') ?? 0,
      },
      {
        name: 'Pro',
        value: rowMap.get('pro') ?? 0,
      },
    ];
  }
}
