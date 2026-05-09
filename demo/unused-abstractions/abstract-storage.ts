import { connect } from '../core/db';
import { config } from '../core/config';
import type { User } from '../types/models';
import type { CacheEntry } from '../types/schemas';

export type Storage = {
  save: (user: User) => void;
  cached: (key: string) => CacheEntry | null;
};

export const createStorage = (): Storage => ({
  save: (user) => { const db = connect(); },
  cached: (key) => null,
});
