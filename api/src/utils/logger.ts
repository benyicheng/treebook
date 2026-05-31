/**
 * Lightweight structured logger for the API.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('DB error', { err, traceId });
 *
 * Output format (JSON, one line per entry):
 *   {"level":"info","time":"2026-05-29T08:00:00.000Z","msg":"User logged in","userId":"123"}
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LOG_LEVEL_RANK) return env;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function serialize(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  const entry: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    msg,
    ...meta,
  };
  try {
    return JSON.stringify(entry);
  } catch {
    return JSON.stringify({ level, time: entry.time, msg, serializationError: true });
  }
}

function write(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (LOG_LEVEL_RANK[level] < LOG_LEVEL_RANK[getMinLevel()]) return;
  const line = serialize(level, msg, meta);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => write('debug', msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => write('info',  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => write('warn',  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
};

export type Logger = typeof logger;
