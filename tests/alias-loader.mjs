import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }

  if (specifier.startsWith('@/')) {
    const base = join(process.cwd(), 'src', specifier.slice(2));
    const candidates = [base, `${base}.js`, join(base, 'index.js')];
    const resolved = candidates.find(existsSync);
    if (!resolved) {
      throw new Error(`[alias-loader] Cannot resolve '${specifier}': tried ${candidates.join(', ')}`);
    }
    return nextResolve(pathToFileURL(resolved).href, context);
  }

  return nextResolve(specifier, context);
}
