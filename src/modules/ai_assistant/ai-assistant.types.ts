export const AI_ASSISTANT_TYPES = {
  repositories: {
    AiConversationRepository: Symbol('AiConversationRepository'),
    AiMessageRepository: Symbol('AiMessageRepository'),
    AiGenerationRepository: Symbol('AiGenerationRepository'),
    AiUsageRepository: Symbol('AiUsageRepository'),
    AiToolCallRepository: Symbol('AiToolCallRepository'),
  },
  runtime: {
    AiRuntime: Symbol('AiRuntime'),
  },
} as const;
