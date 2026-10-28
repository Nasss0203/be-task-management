import { Injectable } from '@nestjs/common';
import { MentionCandidateService } from '../../services/mention-candidate.service';
import { ListMentionCandidatesQuery } from './list-mention-candidates.query';

export interface MentionCandidateResponseDto {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

const CANDIDATE_LIMIT = 20;

@Injectable()
export class ListMentionCandidatesHandler {
  constructor(private readonly candidates: MentionCandidateService) {}

  async execute(
    query: ListMentionCandidatesQuery,
  ): Promise<MentionCandidateResponseDto[]> {
    const search = query.search.trim().slice(0, 100);

    const users = await this.candidates.findAllowed(query.pageId, {
      query: search || undefined,
      limit: CANDIDATE_LIMIT,
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatarUrl,
    }));
  }
}
