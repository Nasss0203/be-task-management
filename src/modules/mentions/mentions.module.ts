import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentionOrmEntity } from './infrastructure/persistence/typeorm/entities/mention.orm-entity';
import { TypeOrmMentionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-mention.repository';
import { MENTION_TYPES } from './mentions.types';

@Module({
  imports: [TypeOrmModule.forFeature([MentionOrmEntity])],
  providers: [
    {
      provide: MENTION_TYPES.repositories.MentionRepository,
      useClass: TypeOrmMentionRepository,
    },
  ],
  exports: [MENTION_TYPES.repositories.MentionRepository],
})
export class MentionsModule {}
