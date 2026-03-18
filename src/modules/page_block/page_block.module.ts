import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageBlock } from './domain/entities/page_block.entity';
import { PageBlockController } from './page_block.controller';
import { PageBlockService } from './page_block.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageBlock])],
  controllers: [PageBlockController],
  providers: [PageBlockService],
})
export class PageBlockModule {}
