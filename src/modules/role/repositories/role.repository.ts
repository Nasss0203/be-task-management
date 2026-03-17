import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Role } from '../domain/entities/role.entity';
import { RoleModel } from '../domain/model/role.model';
import {
  RoleRepository,
  SaveRoleInput,
} from '../interfaces/repositories/role.repository.interface';
import { RoleMapper } from '../mapper/role.mapper';

@Injectable()
export class RoleRepositoryImpl implements RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}
  private getRepo(manager?: EntityManager): Repository<Role> {
    return manager ? manager.getRepository(Role) : this.repo;
  }
  async save(
    workspace: RoleModel | SaveRoleInput,
    manager?: EntityManager,
  ): Promise<RoleModel> {
    const repo = this.getRepo(manager);
    const entity = RoleMapper.toEntity(workspace as RoleModel);
    const saved = await repo.save(entity);
    return RoleMapper.toModel(saved);
  }
}
