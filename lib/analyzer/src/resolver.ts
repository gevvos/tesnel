import { ResolverFactory, type NapiResolveOptions } from 'oxc-resolver';
import { existsSync } from 'fs';
import { join } from 'path';

let cachedResolver: ReturnType<typeof createResolver> | null = null;
let cachedRoot: string | null = null;

const findTsconfig = (root: string): string | null => {
  const candidates = [
    join(root, '.nuxt/tsconfig.app.json'),
    join(root, 'tsconfig.json'),
    join(root, 'tsconfig.app.json'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
};

const createResolver = (root?: string) => {
  const options: NapiResolveOptions = {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs'],
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    },
  };

  if (root) {
    const tsconfig = findTsconfig(root);
    if (tsconfig) {
      options.tsconfig = {
        configFile: tsconfig,
        references: 'auto' as const,
      };
    }
  }

  return new ResolverFactory(options);
};

export const initResolver = (root: string) => {
  if (cachedRoot !== root) {
    cachedResolver = createResolver(root);
    cachedRoot = root;
  }
};

export const resolveFilePath = (directory: string, path: string) => {
  const resolver = cachedResolver || createResolver();
  return resolver.sync(directory, path);
};
