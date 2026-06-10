export interface DeleteAttachmentRepository {
  delete(id: string): Promise<void>;
}
