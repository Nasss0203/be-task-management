export const ATTACHMENT_TOKENS = {
  repository: Symbol('AttachmentRepository'),
  storage: Symbol('AttachmentStoragePort'),
  fileValidator: Symbol('AttachmentFileValidatorPort'),
} as const;
