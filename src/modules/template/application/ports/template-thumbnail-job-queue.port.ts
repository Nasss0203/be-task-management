export type GenerateTemplateThumbnailJobInput = {
  templateId: string;
  versionId: string;
};

export interface TemplateThumbnailJobQueue {
  enqueueGenerateThumbnail(
    input: GenerateTemplateThumbnailJobInput,
  ): Promise<void>;
}
