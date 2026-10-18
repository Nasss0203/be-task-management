/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';

import { TemplateAnalyticsEventType } from '../../../../domain/enums/template-analytics-event-type.enum';
import type { TemplateAnalyticsEventRepository } from '../../../../domain/repositories/template-analytics-event.repository';
import { PublicTemplateController } from '../../../../presentation/http/controllers/public-template.controller';
import { RecordTemplateViewCommand } from './record-template-view.command';
import { RecordTemplateViewHandler } from './record-template-view.handler';

describe('RecordTemplateViewHandler', () => {
  let templates: jest.Mocked<Pick<TemplateContentPort, 'findPublicById'>>;
  let analyticsEvents: jest.Mocked<TemplateAnalyticsEventRepository>;
  let handler: RecordTemplateViewHandler;

  beforeEach(() => {
    templates = {
      findPublicById: jest.fn().mockResolvedValue({
        template: { getId: () => 'template-1' },
        version: { getId: () => 'version-latest' },
      }),
    } as unknown as jest.Mocked<Pick<TemplateContentPort, 'findPublicById'>>;
    analyticsEvents = {
      insertIfAbsent: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
    };
    handler = new RecordTemplateViewHandler(
      templates as unknown as TemplateContentPort,
      analyticsEvents,
    );
  });

  it('records a listing-level VIEW for a signed-in viewer', async () => {
    await handler.execute(
      new RecordTemplateViewCommand('template-1', 'user-1'),
    );

    expect(analyticsEvents.insertIfAbsent).toHaveBeenCalledTimes(1);
    const [event] = analyticsEvents.insertIfAbsent.mock.calls[0];
    expect(event.getEventType()).toBe(TemplateAnalyticsEventType.VIEW);
    expect(event.getTemplateId()).toBe('template-1');
    expect(event.getUserId()).toBe('user-1');
    expect(event.getSourceId()).toBeNull();
    // Never stamps the latest version onto a listing view.
    expect(event.getVersionId()).toBeNull();
  });

  it('records guest views with a null user', async () => {
    await handler.execute(new RecordTemplateViewCommand('template-1', null));

    const [event] = analyticsEvents.insertIfAbsent.mock.calls[0];
    expect(event.getUserId()).toBeNull();
  });

  it('stores every call; dedupe happens when analytics are read', async () => {
    await handler.execute(
      new RecordTemplateViewCommand('template-1', 'user-1'),
    );
    await handler.execute(
      new RecordTemplateViewCommand('template-1', 'user-1'),
    );

    expect(analyticsEvents.insertIfAbsent).toHaveBeenCalledTimes(2);
  });

  it('rejects templates that are not publicly viewable without writing', async () => {
    templates.findPublicById.mockResolvedValue(null);

    await expect(
      handler.execute(new RecordTemplateViewCommand('private-1', 'user-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(analyticsEvents.insertIfAbsent).not.toHaveBeenCalled();
  });

  it('propagates write failures', async () => {
    analyticsEvents.insertIfAbsent.mockRejectedValue(new Error('db down'));

    await expect(
      handler.execute(new RecordTemplateViewCommand('template-1', null)),
    ).rejects.toThrow('db down');
  });

  it('is exposed as a public POST so guests can record views', () => {
    const route = PublicTemplateController.prototype.recordView;

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, route)).toBe(true);
    expect(Reflect.getMetadata(METHOD_METADATA, route)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(PATH_METADATA, route)).toBe(':templateId/views');
  });
});
