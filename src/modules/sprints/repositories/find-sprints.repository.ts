import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Sprint } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { SprintProgressResponseDto } from '../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../interfaces/find-sprint-query.interface';
import { FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class FindSprintRepositoryImpl implements FindSprintRepository {
  constructor(
    @InjectRepository(Sprint)
    private readonly repo: Repository<Sprint>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Sprint> {
    return manager ? manager.getRepository(Sprint) : this.repo;
  }

  async existsByProjectIdAndName(
    projectId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return await this.getRepo(manager).exists({
      where: {
        projectId,
        name,
      },
    });
  }

  async findOneSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const sprint = await this.getRepo(manager).findOne({
      where: {
        id: sprintId,
      },
      relations: {
        tasks: true,
      },
    });

    if (!sprint) {
      return null;
    }

    return SprintsMapper.toModel(sprint);
  }

  async findAllSprintByProject(
    workspaceId: string,
    projectId: string,
    query?: FindSprintQuery,
    manager?: EntityManager,
  ): Promise<SprintsModel[]> {
    const repo = this.getRepo(manager);

    const qb = repo
      .createQueryBuilder('sprint')
      .where('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.project_id = :projectId', { projectId })
      .andWhere('sprint.deleted_at IS NULL');

    const keyword = query?.keyword?.trim();

    if (keyword) {
      qb.andWhere(
        '(sprint.name ILIKE :keyword OR sprint.goal ILIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    if (query?.status) {
      qb.andWhere('sprint.status = :status', {
        status: query.status,
      });
    }

    if (query?.from) {
      qb.andWhere('sprint.start_at >= :from', {
        from: query.from,
      });
    }

    if (query?.to) {
      qb.andWhere('sprint.start_at <= :to', {
        to: query.to,
      });
    }

    const sprints = await qb
      .orderBy('sprint.start_at', 'ASC')
      .addOrderBy('sprint.created_at', 'ASC')
      .getMany();

    return sprints.map(SprintsMapper.toModel);
  }

  async findTasksBySprint(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const sprint = await this.getRepo(manager).findOne({
      where: {
        workspaceId,
        projectId,
        id: sprintId,
      },
      relations: {
        tasks: true,
      },
    });

    if (!sprint) {
      return null;
    }

    return SprintsMapper.toModel(sprint);
  }

  async getSprintProgress(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintProgressResponseDto | null> {
    const repo = this.getRepo(manager);

    const row = await repo
      .createQueryBuilder('sprint')
      .leftJoin('sprint.tasks', 'task')
      .leftJoin('task.status', 'status')
      .select('sprint.id', 'sprintId')
      .addSelect('COUNT(task.id)::int', 'totalTasks')
      .addSelect(
        `COALESCE(SUM(CASE WHEN status.is_done = true THEN 1 ELSE 0 END), 0)::int`,
        'doneTasks',
      )
      .where('sprint.workspace_id = :workspaceId', { workspaceId })
      .andWhere('sprint.project_id = :projectId', { projectId })
      .andWhere('sprint.id = :sprintId', { sprintId })
      .andWhere('sprint.deleted_at IS NULL')
      .groupBy('sprint.id')
      .getRawOne<{
        sprintId: string;
        totalTasks: number | string;
        doneTasks: number | string;
      }>();

    if (!row) {
      return null;
    }

    const totalTasks = Number(row.totalTasks);
    const doneTasks = Number(row.doneTasks);
    const notDoneTasks = totalTasks - doneTasks;
    const progressPercent =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
      sprintId: row.sprintId,
      totalTasks,
      doneTasks,
      notDoneTasks,
      progressPercent,
    };
  }
}
