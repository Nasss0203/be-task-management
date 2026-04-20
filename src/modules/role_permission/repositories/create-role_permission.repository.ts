import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RolePermission } from '../domain/entities/role_permission.entity';
import {
  CreateRolePermissionInput,
  CreateRolePermissionRepository,
} from '../interfaces/repositories/create-role_permission.repository.interface';

@Injectable()
export class CreateRolePermissionRepositoryImpl implements CreateRolePermissionRepository {
  constructor(
    @InjectRepository(RolePermission)
    private readonly repo: Repository<RolePermission>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<RolePermission> {
    return manager ? manager.getRepository(RolePermission) : this.repo;
  }

  async saveMany(
    data: CreateRolePermissionInput[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!data.length) return;

    const repo = this.getRepo(manager);
    const entities = repo.create(data);
    await repo.save(entities);
  }
}
