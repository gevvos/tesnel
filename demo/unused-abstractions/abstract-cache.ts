import { connect } from '../core/db';
import { config } from '../core/config';
import type { CacheEntry } from '../types/schemas';

export type Cache = {
  get: (key: string) => CacheEntry | null;
  set: (entry: CacheEntry) => void;
};

export const createCache = (): Cache => ({
  get: (key) => null,
  set: (entry) => {},
});
