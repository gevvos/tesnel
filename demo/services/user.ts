import { connect } from '../core/db';
import type { User } from '../types/models';

export const getUser = (id: string): User => {
  const db = connect();
  return { id, name: 'Test', email: 'test@test.com' };
};
