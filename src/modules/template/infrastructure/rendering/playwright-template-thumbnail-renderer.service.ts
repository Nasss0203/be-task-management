import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium } from 'playwright';

import {
  type RenderedTemplateThumbnail,
  type RenderTemplateThumbnailInput,
  type TemplateThumbnailRenderer,
} from '../../application/ports/template-thumbnail-renderer.port';

const THUMBNAIL_WIDTH = 1440;
const THUMBNAIL_HEIGHT = 900;

@Injectable()
export class PlaywrightTemplateThumbnailRendererService implements TemplateThumbnailRenderer {
  constructor(private readonly configService: ConfigService) {}

  async render(
    input: RenderTemplateThumbnailInput,
  ): Promise<RenderedTemplateThumbnail> {
    const frontendUrl = this.configService.getOrThrow<string>(
      'TEMPLATE_RENDER_FRONTEND_URL',
    );

    const internalKey = this.configService.getOrThrow<string>(
      'TEMPLATE_RENDER_INTERNAL_KEY',
    );

    const renderUrl = new URL(
      `/internal/template-render/${encodeURIComponent(
        input.templateId,
      )}/versions/${encodeURIComponent(input.versionId)}`,
      frontendUrl,
    ).toString();

    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage({
        viewport: {
          width: THUMBNAIL_WIDTH,
          height: THUMBNAIL_HEIGHT,
        },
        extraHTTPHeaders: {
          'x-template-render-key': internalKey,
        },
      });

      const response = await page.goto(renderUrl, {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      if (!response || !response.ok()) {
        throw new Error(
          `Template render page failed with status ${response?.status() ?? 'unknown'}`,
        );
      }

      // Chờ font hoàn tất để giảm layout shift khi screenshot.
      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      // Chờ các image hiện có load xong.
      await page.evaluate(async () => {
        const images = Array.from(document.images);

        await Promise.all(
          images.map((image) => {
            if (image.complete) {
              return Promise.resolve();
            }

            return new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), {
                once: true,
              });

              image.addEventListener('error', () => resolve(), {
                once: true,
              });
            });
          }),
        );
      });

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
      });

      return {
        buffer: Buffer.from(screenshot),
        contentType: 'image/png',
        width: THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT,
      };
    } finally {
      await browser.close();
    }
  }
}
