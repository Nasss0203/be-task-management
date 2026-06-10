export interface AttachmentStorageRouterService {
  buildStorageKey(params: {
    workspaceId: string;
    taskId?: string | null;
    commentId?: string | null;
    fileName: string;
  }): string;

  uploadBuffer(params: {
    key: string;
    buffer: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<void>;

  createDownloadUrl(params: {
    key: string;
    fileName: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }>;

  uploadToCloudinary(params: {
    buffer: Buffer;
    workspaceId: string;
    taskId?: string | null;
    commentId?: string | null;
    fileName: string;
  }): Promise<{ url: string; secureUrl: string; publicId: string }>;
}
