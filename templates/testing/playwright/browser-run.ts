import { chromium, type Browser, type BrowserContext, type TestInfo } from '@playwright/test';

export interface BrowserRunOptions {
  cdpUrl: string;
  token: string;
  expectedArtifact: string;
  previewUrl: string;
}

export async function connectBrowserRun(options: BrowserRunOptions): Promise<Browser> {
  return chromium.connectOverCDP(options.cdpUrl, { headers: { Authorization: `Bearer ${options.token}` } });
}

export async function isolatedContext(browser: Browser, testInfo: TestInfo): Promise<BrowserContext> {
  return browser.newContext({
    locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce',
    extraHTTPHeaders: { 'x-test-namespace': `${testInfo.project.name}-${testInfo.workerIndex}-${testInfo.retry}` }
  });
}

export async function assertExactPreview(context: BrowserContext, options: BrowserRunOptions): Promise<void> {
  const response = await context.request.get(new URL('/__artifact', options.previewUrl).toString());
  if (!response.ok()) throw new Error(`preview identity endpoint failed: ${response.status()}`);
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null || !('artifact' in body) || body.artifact !== options.expectedArtifact) {
    throw new Error('preview artifact does not match selected immutable artifact');
  }
}

export async function withBrowserRun<T>(options: BrowserRunOptions, testInfo: TestInfo, run: (context: BrowserContext) => Promise<T>): Promise<T> {
  const browser = await connectBrowserRun(options);
  let context: BrowserContext | undefined;
  try {
    context = await isolatedContext(browser, testInfo);
    await assertExactPreview(context, options);
    return await run(context);
  } finally {
    await context?.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}
