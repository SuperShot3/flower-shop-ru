/** Load `.env.local` for npm scripts (tsx does not auto-load it like Next.js dev). */
import path from 'node:path';

import { config } from 'dotenv';

export function loadLocalEnv(): void {
  config({ path: path.join(process.cwd(), '.env.local') });
}
