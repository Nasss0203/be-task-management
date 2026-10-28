import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { COMMENT_TYPES } from './comments.types';
import { CommentOrmEntity } from './infrastructure/persistence/typeorm/entities/comment.orm-entity';
import { TypeOrmCommentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-comment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CommentOrmEntity])],
  providers: [
    {
      provide: COMMENT_TYPES.repositories.CommentRepository,
      useClass: TypeOrmCommentRepository,
    },
  ],
  exports: [COMMENT_TYPES.repositories.CommentRepository],
})
export class CommentsModule {}
