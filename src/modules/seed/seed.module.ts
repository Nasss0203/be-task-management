import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permission/domain/entities/permission.entity';
import { RbacSeedService } from './rbac.seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  providers: [RbacSeedService],
  exports: [RbacSeedService],
})
export class SeedsModule {}
