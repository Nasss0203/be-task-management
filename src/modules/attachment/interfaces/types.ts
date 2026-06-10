export const ATTACHMENT_TYPES = {
  applications: {
    UploadAttachmentApplication: Symbol('UploadAttachmentApplication'),
    UpdateAttachmentApplication: Symbol('UpdateAttachmentApplication'),
    FindAttachmentApplication: Symbol('FindAttachmentApplication'),
    DeleteAttachmentApplication: Symbol('DeleteAttachmentApplication'),
    CreateAttachmentDownloadUrlApplication: Symbol(
      'CreateAttachmentDownloadUrlApplication',
    ),
  },

  repositories: {
    UploadAttachmentRepository: Symbol('UploadAttachmentRepository'),
    UpdateAttachmentRepository: Symbol('UpdateAttachmentRepository'),
    FindAttachmentRepository: Symbol('FindAttachmentRepository'),
    DeleteAttachmentRepository: Symbol('DeleteAttachmentRepository'),
  },

  services: {
    UploadAttachmentService: Symbol('UploadAttachmentService'),
    UpdateAttachmentService: Symbol('UpdateAttachmentService'),
    FindAttachmentService: Symbol('FindAttachmentService'),
    DeleteAttachmentService: Symbol('DeleteAttachmentService'),
    CreateAttachmentDownloadUrlService: Symbol(
      'CreateAttachmentDownloadUrlService',
    ),
    AttachmentFileValidatorService: Symbol('AttachmentFileValidatorService'),
    AttachmentStorageRouterService: Symbol('AttachmentStorageRouterService'),
  },
};
