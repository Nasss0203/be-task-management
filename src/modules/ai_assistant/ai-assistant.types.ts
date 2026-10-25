export const AI_ASSISTANT_TYPES = {
  ports: {
    AiIntent: Symbol('AiIntent'),
    PageResolutionReader: Symbol('PageResolutionReader'),
    PageIntentExtractor: Symbol('PageIntentExtractor'),
    PageContextTransactionLocker: Symbol('PageContextTransactionLocker'),
  },
  services: {
    AiConversationAccess: Symbol('AiConversationAccess'),
  },
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
