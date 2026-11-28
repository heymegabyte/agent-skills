import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isCliEntrypoint(moduleUrl: string): boolean {
  const entrypoint = process.argv[1];
  if (!entrypoint) return false;
  try {
    return realpathSync(entrypoint) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
