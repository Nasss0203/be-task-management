import { Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { MENTION_TYPES } from '../../mentions.types';
import type {
  MentionCandidate,
  MentionCandidateReader,
} from '../ports/mention-candidate-reader.port';

/**
 * Ai được mention trong một page:
 * - thành viên workspace (không gồm guest), hoặc chỉ thành viên teamspace nếu page thuộc teamspace;
 * - và thật sự đọc được page (page riêng tư có thể chặn thành viên workspace).
 */
@Injectable()
export class MentionCandidateService {
  constructor(
    @Inject(MENTION_TYPES.ports.MentionCandidateReader)
    private readonly reader: MentionCandidateReader,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findAllowed(
    pageId: string,
    filter: { query?: string; userIds?: string[]; limit: number },
  ): Promise<MentionCandidate[]> {
    const scope = await this.reader.findPageScope(pageId);

    if (!scope) return [];

    const members = await this.reader.findMembers({ scope, ...filter });

    const canRead = await Promise.all(
      members.map((member) =>
        this.authorizationService.authorize({
          userId: member.id,
          permissions: [PERMISSIONS.PAGE_READ],
          target: { type: 'page', id: pageId },
        }),
      ),
    );

    return members.filter((_, index) => canRead[index]);
  }
}
