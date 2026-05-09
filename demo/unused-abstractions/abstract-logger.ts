import { config } from '../core/config';
import type { LogLevel } from '../types/schemas';

export type Logger = {
  log: (level: LogLevel, message: string) => void;
};

export const createLogger = (): Logger => ({
  log: (level, message) => console.log(`[${level}] ${message} on port ${config.port}`),
});
