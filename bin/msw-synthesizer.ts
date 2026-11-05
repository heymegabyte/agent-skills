#!/usr/bin/env node
/**
 * Hermetic Mock Service Worker Route Synthesizer
 * Inspects backend OpenAPI / Hono route definitions and generates type-safe MSW client-side mock handlers with deterministic fixture data.
 */

export interface ApiEndpointSpec {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  responseStatus: number;
  mockResponseBody: Record<string, unknown>;
}

export function synthesizeMswHandlers(specs: ApiEndpointSpec[]): string {
  const handlerLines: string[] = [
    `import { http, HttpResponse } from "msw";`,
    ``,
    `export const handlers = [`,
  ];

  for (const spec of specs) {
    const jsonStr = JSON.stringify(spec.mockResponseBody, null, 2).split("\n").map((l) => `    ${l}`).join("\n");
    handlerLines.push(`  http.${spec.method}("${spec.path}", () => {`);
    handlerLines.push(`    return HttpResponse.json(`);
    handlerLines.push(jsonStr);
    handlerLines.push(`    , { status: ${spec.responseStatus} });`);
    handlerLines.push(`  }),`);
  }

  handlerLines.push(`];`);
  return handlerLines.join("\n");
}

if (process.argv[1]?.endsWith("msw-synthesizer.ts")) {
  console.log("MSW Route Synthesizer ready.");
}
