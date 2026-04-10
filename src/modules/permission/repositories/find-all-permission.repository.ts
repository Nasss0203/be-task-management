import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Permission } from '../domain/entities/permission.entity';
import { PermissionModel } from '../domain/models/permission.model';
import { FindPermissionRepository } from '../interfaces/repositories/find-all-permission.repository.interface';

@Injectable()
export class FindPermissionRepositoryImpl implements FindPermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Permission> {
    return manager ? manager.getRepository(Permission) : this.repo;
  }

  async findAll(manager?: EntityManager): Promise<PermissionModel[]> {
    const permissions = await this.getRepo(manager).find();

    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      description: permission.description,
      created_at: permission.created_at,
    }));
  }
}
