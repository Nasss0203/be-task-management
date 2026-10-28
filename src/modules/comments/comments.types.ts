export const COMMENT_TYPES = {
  repositories: {
    CommentRepository: Symbol('CommentRepository'),
  },
  ports: {
    CommentTargetResolver: Symbol('CommentTargetResolver'),
  },
} as const;
