#!/usr/bin/env node
/**
 * @file indexnow-client.ts
 * @brief Automated IndexNow Client for Instant Search Engine Submission.
 *
 * Automatically notifies Bing, Yandex, Naver, and Seznam search engines
 * whenever URLs are published or updated.
 */

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

export interface IndexNowResult {
  success: boolean;
  status: number;
  message: string;
  submittedUrls: number;
}

export async function submitToIndexNow(payload: IndexNowPayload, dryRun = false): Promise<IndexNowResult> {
  if (dryRun) {
    console.log(`[IndexNow] Dry-run: Would submit ${payload.urlList.length} URLs for host ${payload.host}`);
    return {
      success: true,
      status: 200,
      message: 'Dry-run successful',
      submittedUrls: payload.urlList.length,
    };
  }

  const endpoint = 'https://api.indexnow.org/indexnow';
  const body = {
    host: payload.host,
    key: payload.key,
    keyLocation: payload.keyLocation || `https://${payload.host}/${payload.key}.txt`,
    urlList: payload.urlList,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    const isSuccess = res.status === 200 || res.status === 202;
    return {
      success: isSuccess,
      status: res.status,
      message: isSuccess ? 'URLs submitted successfully to IndexNow' : `IndexNow error: HTTP ${res.status}`,
      submittedUrls: payload.urlList.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: 500,
      message: `Failed to submit to IndexNow: ${msg}`,
      submittedUrls: payload.urlList.length,
    };
  }
}

if (process.argv[1]?.endsWith('indexnow-client.ts') || import.meta.main) {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.length <= 2;
  const host = process.argv.find((a) => a.startsWith('--host='))?.split('=')[1] || 'megabyte.space';
  const urls = ['https://megabyte.space/', 'https://megabyte.space/about'];

  console.log(`[IndexNow] Preparing submission for ${host}...`);
  submitToIndexNow({
    host,
    key: 'megabyte-indexnow-sample-key',
    urlList: urls,
  }, isDryRun).then((result) => {
    console.log(`[IndexNow] Status: ${result.status} | ${result.message}`);
    process.exit(result.success ? 0 : 1);
  });
}
