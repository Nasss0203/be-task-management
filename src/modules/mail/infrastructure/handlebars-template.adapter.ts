import type { MailerOptions, TemplateAdapter } from '@nestjs-modules/mailer';
import { readFileSync } from 'fs';
import * as handlebars from 'handlebars';
import { join } from 'path';

// The library's HandlebarsAdapter loads @css-inline, a native binary that Windows
// Smart App Control blocks; our templates already use inline styles.
export class HandlebarsTemplateAdapter implements TemplateAdapter {
  private readonly templates = new Map<string, HandlebarsTemplateDelegate>();

  compile(
    mail: { data: { template: string; context: unknown; html?: string } },
    callback: (err?: unknown) => void,
    options: MailerOptions,
  ): void {
    const name = mail.data.template;

    try {
      let template = this.templates.get(name);
      if (!template) {
        const source = readFileSync(
          join(options.template?.dir ?? '', `${name}.hbs`),
          'utf-8',
        );
        template = handlebars.compile(source, options.template?.options);
        this.templates.set(name, template);
      }

      mail.data.html = template(mail.data.context);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
