import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { MentionsModule } from '../mentions/mentions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionModule } from '../permission/permission.module';
import { CreateCommentHandler } from './application/commands/comment/create-comment/create-comment.handler';
import { DeleteCommentHandler } from './application/commands/comment/delete-comment/delete-comment.handler';
import { ResolveCommentHandler } from './application/commands/comment/resolve-comment/resolve-comment.handler';
import { UpdateCommentHandler } from './application/commands/comment/update-comment/update-comment.handler';
import { CountBlockCommentsHandler } from './application/queries/comment/count-block-comments/count-block-comments.handler';
import { ListCommentsHandler } from './application/queries/comment/list-comments/list-comments.handler';
import { CommentAuthorService } from './application/services/comment-author.service';
import { CommentNotificationService } from './application/services/comment-notification.service';
import { COMMENT_TYPES } from './comments.types';
import { SqlCommentTargetResolver } from './infrastructure/persistence/typeorm/adapters/sql-comment-target-resolver.adapter';
import { CommentOrmEntity } from './infrastructure/persistence/typeorm/entities/comment.orm-entity';
import { TypeOrmCommentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-comment.repository';
import { CommentController } from './presentation/http/controllers/comment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentOrmEntity]),
    forwardRef(() => IdentityModule),
    PermissionModule,
    MentionsModule,
    NotificationsModule,
  ],
  controllers: [CommentController],
  providers: [
    {
      provide: COMMENT_TYPES.repositories.CommentRepository,
      useClass: TypeOrmCommentRepository,
    },
    {
      provide: COMMENT_TYPES.ports.CommentTargetResolver,
      useClass: SqlCommentTargetResolver,
    },
    CommentAuthorService,
    CommentNotificationService,
    CreateCommentHandler,
    UpdateCommentHandler,
    DeleteCommentHandler,
    ResolveCommentHandler,
    ListCommentsHandler,
    CountBlockCommentsHandler,
  ],
  exports: [COMMENT_TYPES.repositories.CommentRepository, CreateCommentHandler],
})
export class CommentsModule {}
