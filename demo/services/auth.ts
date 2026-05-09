import { connect } from '../core/db';
import { config } from '../core/config';
import type { User, Session } from '../types/models';

export const login = (email: string): Session => {
  const db = connect();
  const users = db.query(`SELECT * FROM users WHERE email = '${email}'`);
  return { token: 'abc', userId: '1' };
};
