import { doStuff } from './service';
import type { Config } from './types';

const cfg: Config = { name: 'test' };
doStuff(cfg);
