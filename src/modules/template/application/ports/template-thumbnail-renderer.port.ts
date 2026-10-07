export interface RenderTemplateThumbnailInput {
  templateId: string;
  versionId: string;
}

export interface RenderedTemplateThumbnail {
  buffer: Buffer;
  contentType: 'image/png';
  width: number;
  height: number;
}

export interface TemplateThumbnailRenderer {
  render(
    input: RenderTemplateThumbnailInput,
  ): Promise<RenderedTemplateThumbnail>;
}
