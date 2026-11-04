export const MENTION_TYPES = {
  repositories: {
    MentionRepository: Symbol('MentionRepository'),
  },
  ports: {
    MentionCandidateReader: Symbol('MentionCandidateReader'),
  },
} as const;
