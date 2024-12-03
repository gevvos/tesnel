import { ResolverFactory } from 'oxc-resolver';

const resolver = new ResolverFactory();

export const resolveFilePath = (directory: string, path: string) => {
  return resolver.sync(directory, path);
}
