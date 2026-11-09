export const ATTACHMENT_TOKENS = {
  repository: Symbol('AttachmentRepository'),
  storage: Symbol('AttachmentStoragePort'),
  fileValidator: Symbol('AttachmentFileValidatorPort'),
  storageReader: Symbol('WorkspaceStorageReader'),
} as const;
