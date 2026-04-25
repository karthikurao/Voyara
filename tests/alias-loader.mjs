import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }

  if (specifier.startsWith('@/')) {
    const absolutePath = join(process.cwd(), 'src', specifier.slice(2));
    return nextResolve(pathToFileURL(absolutePath).href, context);
  }

  return nextResolve(specifier, context);
}
