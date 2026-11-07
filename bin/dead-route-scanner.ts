#!/usr/bin/env node
/**
 * dead-route-scanner.ts
 * Dead Route & Orphaned Endpoint Scanner.
 * Identifies API routes declared in backend microservices that are never referenced
 * by frontend clients, documentation, or test suites.
 */

export interface RouteRef {
  path: string;
  method: string;
  isReferenced: boolean;
}

export function scanOrphanedRoutes(registeredRoutes: string[], clientSourceCode: string): RouteRef[] {
  return registeredRoutes.map(r => {
    const cleanPath = r.split(' ')[1] || r;
    const method = r.split(' ')[0] || 'GET';
    const isReferenced = clientSourceCode.includes(cleanPath);
    return {
      path: cleanPath,
      method,
      isReferenced
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Dead Route Scanner Test ---');
  const serverRoutes = ['GET /api/v1/users', 'POST /api/v1/auth/login', 'DELETE /api/v1/legacy/tokens'];
  const clientCode = `
    fetch('/api/v1/users');
    fetch('/api/v1/auth/login', { method: 'POST' });
  `;

  const results = scanOrphanedRoutes(serverRoutes, clientCode);
  console.log(results);
}
