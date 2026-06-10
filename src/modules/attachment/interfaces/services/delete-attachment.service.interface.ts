export interface DeleteAttachmentService {
  execute(id: string): Promise<void>;
}
