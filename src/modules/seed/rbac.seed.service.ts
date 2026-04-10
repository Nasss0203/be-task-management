import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { PERMISSION_SEED_DATA } from '../permission/constants/permission.constant';
import { Permission } from '../permission/domain/entities/permission.entity';

@Injectable()
export class RbacSeedService {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async seedPermissions(): Promise<void> {
    for (const item of PERMISSION_SEED_DATA) {
      const existed = await this.permissionRepository.findOne({
        where: { code: item.code },
      });

      if (existed) {
        this.logger.log(`Permission existed: ${item.code}`);
        continue;
      }

      const permission = this.permissionRepository.create({
        code: item.code,
        description: item.description,
      });

      await this.permissionRepository.save(permission);
      this.logger.log(`Seeded permission: ${item.code}`);
    }
  }

  async seed(): Promise<void> {
    await this.seedPermissions();
    this.logger.log('RBAC seed completed');
  }
}
