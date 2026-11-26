import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { lastValueFrom, of, throwError } from 'rxjs';
import { RemoveUploadedTempFileInterceptor } from './remove-uploaded-temp-file.interceptor';

const tempDir = mkdtempSync(join(tmpdir(), 'upload-cleanup-'));

const contextFor = (file?: { path: string }) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ file }) }),
  }) as unknown as ExecutionContext;

const createTempFile = (name: string) => {
  const path = join(tempDir, name);
  writeFileSync(path, 'data');
  return path;
};

const waitUntilRemoved = async (path: string) => {
  for (let attempt = 0; attempt < 50 && existsSync(path); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

describe('RemoveUploadedTempFileInterceptor', () => {
  const interceptor = new RemoveUploadedTempFileInterceptor();

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('removes the temp file after a successful upload', async () => {
    const path = createTempFile('success');
    const next: CallHandler = { handle: () => of({ id: 'att-1' }) };

    await expect(
      lastValueFrom(interceptor.intercept(contextFor({ path }), next)),
    ).resolves.toEqual({ id: 'att-1' });
    await waitUntilRemoved(path);

    expect(existsSync(path)).toBe(false);
  });

  it('removes the temp file when validation or the handler fails', async () => {
    const path = createTempFile('failure');
    const next: CallHandler = {
      handle: () => throwError(() => new Error('limit exceeded')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(contextFor({ path }), next)),
    ).rejects.toThrow('limit exceeded');
    await waitUntilRemoved(path);

    expect(existsSync(path)).toBe(false);
  });

  it('does nothing when the request has no uploaded file', async () => {
    const next: CallHandler = { handle: () => of('ok') };

    await expect(
      lastValueFrom(interceptor.intercept(contextFor(), next)),
    ).resolves.toBe('ok');
  });
});
