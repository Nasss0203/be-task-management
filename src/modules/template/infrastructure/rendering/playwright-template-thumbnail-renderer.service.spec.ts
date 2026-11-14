import type { ConfigService } from '@nestjs/config';
import type { Request, Route } from 'playwright';

import { PlaywrightTemplateThumbnailRendererService } from './playwright-template-thumbnail-renderer.service';

type RouteHandler = (route: Route) => Promise<void>;

const routeHandlers: RouteHandler[] = [];

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(() =>
      Promise.resolve({
        newPage: jest.fn(() =>
          Promise.resolve({
            route: jest.fn((_url: string, handler: RouteHandler) => {
              routeHandlers.push(handler);
              return Promise.resolve();
            }),
            goto: jest.fn().mockResolvedValue({ ok: () => true }),
            evaluate: jest.fn().mockResolvedValue(undefined),
            screenshot: jest.fn().mockResolvedValue(Buffer.from('png')),
          }),
        ),
        close: jest.fn().mockResolvedValue(undefined),
      }),
    ),
  },
}));

function fakeRoute(url: string) {
  const request = {
    url: () => url,
    headers: () => ({ accept: '*/*' }),
  } as unknown as Request;
  const continueRoute = jest.fn().mockResolvedValue(undefined);

  return {
    route: {
      request: () => request,
      continue: continueRoute,
    } as unknown as Route,
    continueRoute,
  };
}

describe('PlaywrightTemplateThumbnailRendererService', () => {
  const config = {
    getOrThrow: (key: string) =>
      key === 'TEMPLATE_RENDER_FRONTEND_URL'
        ? 'https://app.taskmanly.test'
        : 'render-secret',
  } as unknown as ConfigService;

  beforeAll(async () => {
    await new PlaywrightTemplateThumbnailRendererService(config).render({
      templateId: 'template-1',
      versionId: 'version-1',
    });
  });

  it('sends the render key to the render page origin', async () => {
    const { route, continueRoute } = fakeRoute(
      'https://app.taskmanly.test/internal/template-render/template-1/versions/version-1',
    );

    await routeHandlers[0](route);

    expect(continueRoute).toHaveBeenCalledWith({
      headers: { accept: '*/*', 'x-template-render-key': 'render-secret' },
    });
  });

  it('does not send the render key to other origins', async () => {
    const { route, continueRoute } = fakeRoute(
      'https://images.example.com/cover.png',
    );

    await routeHandlers[0](route);

    expect(continueRoute).toHaveBeenCalledWith();
  });
});
