import { login } from '../services/auth';
import { getUser } from '../services/user';
import { config } from '../core/config';
import type { Logger } from '../unused-abstractions/abstract-logger';

const session = login('admin@test.com');
const user = getUser(session.userId);
console.log(`Started on port ${config.port}`);
