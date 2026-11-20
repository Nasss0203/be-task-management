export type AttachmentFileInput = {
  originalName: string;
  reportedMimeType: string;
  size: number;
  path: string;
};

export interface AttachmentFileValidatorPort {
  validateExtension(fileName: string): string;
  validateRealFileType(
    file: AttachmentFileInput,
    extension: string,
  ): Promise<string>;
}
