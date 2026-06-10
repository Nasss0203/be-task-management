export interface AttachmentFileValidatorService {
  validateExtension(fileName: string): string;
  validateRealFileType(file: Express.Multer.File, ext: string): Promise<string>;
}
