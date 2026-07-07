export const AI_ASSISTANT_TYPES = {
  applications: {
    CreateAiConversationApplication: 'CreateAiConversationApplication',
    ListAiConversationsApplication: 'ListAiConversationsApplication',
    GetAiConversationApplication: 'GetAiConversationApplication',
    SendAiMessageApplication: 'SendAiMessageApplication',
    ApplyAiGenerationApplication: 'ApplyAiGenerationApplication',
    DiscardAiGenerationApplication: 'DiscardAiGenerationApplication',
    GenerateTaskSubtasksApplication: 'GenerateTaskSubtasksApplication',
  },
  services: {
    AiConversationService: 'AiConversationService',
    AiMessageService: 'AiMessageService',
    AiGenerationService: 'AiGenerationService',
    AiProviderService: 'AiProviderService',
  },
  repositories: {
    AiConversationRepository: 'CustomAiConversationRepository',
    AiMessageRepository: 'CustomAiMessageRepository',
    AiGenerationRepository: 'CustomAiGenerationRepository',
    AiContextSnapshotRepository: 'CustomAiContextSnapshotRepository',
  },
};
