export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { assertRussiaRuntimeEnv } = await import('@/lib/env/validateRussiaEnv');
  assertRussiaRuntimeEnv();
}
