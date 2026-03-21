import { Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RoleResponseDto } from '../dto/reponse/role.response.dto';
import { CreateRoleApplication } from '../interfaces/applications/role.application.interface';
import { type CreateRoleService } from '../interfaces/services/create.role.service.interface';
import { ROLE_TYPES } from '../interfaces/types';
import { RoleMapper } from '../mapper/role.mapper';

@Injectable()
export class CreateRoleApplicationImpl implements CreateRoleApplication {
  constructor(
    @Inject(ROLE_TYPES.services.CreateRoleService)
    private readonly service: CreateRoleService,
  ) {}
  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const model = await this.service.create(createRoleDto);

    return RoleMapper.toResponse(model);
  }
}
