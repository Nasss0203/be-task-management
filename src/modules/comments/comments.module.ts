import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModule } from '../content/content.module';
import { IdentityModule } from '../identity/identity.module';
import { PermissionModule } from '../permission/permission.module';
import { CreateCommentHandler } from './application/commands/comment/create-comment/create-comment.handler';
import { DeleteCommentHandler } from './application/commands/comment/delete-comment/delete-comment.handler';
import { UpdateCommentHandler } from './application/commands/comment/update-comment/update-comment.handler';
import { ListPageCommentsHandler } from './application/queries/comment/list-page-comments/list-page-comments.handler';
import { CommentAuthorService } from './application/services/comment-author.service';
import { COMMENT_TYPES } from './comments.types';
import { CommentOrmEntity } from './infrastructure/persistence/typeorm/entities/comment.orm-entity';
import { TypeOrmCommentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-comment.repository';
import { CommentController } from './presentation/http/controllers/comment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentOrmEntity]),
    ContentModule,
    forwardRef(() => IdentityModule),
    PermissionModule,
  ],
  controllers: [CommentController],
  providers: [
    {
      provide: COMMENT_TYPES.repositories.CommentRepository,
      useClass: TypeOrmCommentRepository,
    },
    CommentAuthorService,
    CreateCommentHandler,
    UpdateCommentHandler,
    DeleteCommentHandler,
    ListPageCommentsHandler,
  ],
  exports: [COMMENT_TYPES.repositories.CommentRepository],
})
export class CommentsModule {}
