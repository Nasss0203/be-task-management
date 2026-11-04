import { Inject, Injectable } from '@nestjs/common';
import { type FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { CommentAuthorDto } from '../dto/comment/response/comment.response.dto';

/** Tên tác giả để hiển thị cạnh comment. */
@Injectable()
export class CommentAuthorService {
  constructor(
    @Inject(IDENTITY_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,
  ) {}

  async findAuthors(
    authorIds: string[],
  ): Promise<Map<string, CommentAuthorDto>> {
    const users = await Promise.all(
      [...new Set(authorIds)].map((id) =>
        this.findUserService.findUserById(id),
      ),
    );

    return new Map(
      users
        .filter((user) => user !== null)
        .map((user) => [
          user.id,
          { id: user.id, username: user.username, email: user.email },
        ]),
    );
  }
}
