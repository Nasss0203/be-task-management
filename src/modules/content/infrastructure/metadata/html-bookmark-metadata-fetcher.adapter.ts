import { BadRequestException, Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

import type {
  BookmarkMetadata,
  BookmarkMetadataFetcherPort,
} from '../../../attachment/application/ports/bookmark-metadata-fetcher.port';

const REQUEST_TIMEOUT = 5000;
const MAX_REDIRECTS = 3;

@Injectable()
export class HtmlBookmarkMetadataFetcherAdapter implements BookmarkMetadataFetcherPort {
  async fetch(url: string): Promise<BookmarkMetadata> {
    const normalizedUrl = this.normalizeUrl(url);

    const response = await this.fetchWithSafeRedirects(normalizedUrl);

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('text/html')) {
      throw new BadRequestException('URL does not point to an HTML document');
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    const finalUrl = response.url || normalizedUrl;

    const title =
      this.getMetaContent($, 'meta[property="og:title"]') ||
      this.getMetaContent($, 'meta[name="twitter:title"]') ||
      $('title').first().text().trim() ||
      new URL(finalUrl).hostname;

    const description =
      this.getMetaContent($, 'meta[property="og:description"]') ||
      this.getMetaContent($, 'meta[name="twitter:description"]') ||
      this.getMetaContent($, 'meta[name="description"]') ||
      null;

    const siteName =
      this.getMetaContent($, 'meta[property="og:site_name"]') || null;

    const image =
      this.getMetaContent($, 'meta[property="og:image"]') ||
      this.getMetaContent($, 'meta[name="twitter:image"]') ||
      null;

    const favicon =
      $('link[rel="icon"]').first().attr('href') ||
      $('link[rel="shortcut icon"]').first().attr('href') ||
      null;

    return {
      url: finalUrl,
      title,
      description,
      siteName,
      faviconUrl: this.resolveUrl(favicon, finalUrl),
      imageUrl: this.resolveUrl(image, finalUrl),
    };
  }

  private normalizeUrl(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException('URL is required');
    }

    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('Only HTTP and HTTPS URLs are supported');
    }

    return parsed.toString();
  }

  private async fetchWithSafeRedirects(initialUrl: string): Promise<Response> {
    let currentUrl = initialUrl;

    for (
      let redirectCount = 0;
      redirectCount <= MAX_REDIRECTS;
      redirectCount++
    ) {
      await this.assertSafeUrl(currentUrl);

      let response: Response;

      try {
        response = await fetch(currentUrl, {
          redirect: 'manual',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TaskmanlyBookmarkBot/1.0)',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
      } catch {
        throw new BadRequestException('Unable to fetch bookmark metadata');
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');

        if (!location) {
          throw new BadRequestException('Invalid redirect response');
        }

        currentUrl = new URL(location, currentUrl).toString();

        continue;
      }

      if (!response.ok) {
        throw new BadRequestException(
          `Website returned status ${response.status}`,
        );
      }

      return response;
    }

    throw new BadRequestException('Too many redirects');
  }

  private async assertSafeUrl(value: string): Promise<void> {
    const url = new URL(value);

    const hostname = url.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      throw new BadRequestException('Local URLs are not allowed');
    }

    if (isIP(hostname)) {
      if (this.isPrivateIp(hostname)) {
        throw new BadRequestException('Private network URLs are not allowed');
      }

      return;
    }

    let addresses;

    try {
      addresses = await lookup(hostname, {
        all: true,
      });
    } catch {
      throw new BadRequestException('Unable to resolve URL hostname');
    }

    if (addresses.some(({ address }) => this.isPrivateIp(address))) {
      throw new BadRequestException('Private network URLs are not allowed');
    }
  }

  private isPrivateIp(address: string): boolean {
    if (address === '::1') {
      return true;
    }

    if (
      address.startsWith('fc') ||
      address.startsWith('fd') ||
      address.startsWith('fe80:')
    ) {
      return true;
    }

    const parts = address.split('.').map(Number);

    if (parts.length !== 4) {
      return false;
    }

    const [a, b] = parts;

    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  private getMetaContent(
    $: cheerio.CheerioAPI,
    selector: string,
  ): string | null {
    const value = $(selector).first().attr('content')?.trim();

    return value || null;
  }

  private resolveUrl(value: string | null, baseUrl: string): string | null {
    if (!value) {
      return null;
    }

    try {
      return new URL(value, baseUrl).toString();
    } catch {
      return null;
    }
  }
}
