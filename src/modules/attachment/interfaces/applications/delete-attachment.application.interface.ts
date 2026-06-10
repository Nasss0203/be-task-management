export interface DeleteAttachmentApplication {
  execute(id: string, userId: string): Promise<void>;
}
