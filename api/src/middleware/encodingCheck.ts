import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/http';
import { logger } from '../utils/logger';

/**
 * Replacement Character (U+FFFD) — appears when invalid UTF-8 bytes
 * are decoded. Common when Git Bash curl mangles Chinese characters.
 */
const REPLACEMENT_CHAR = '\uFFFD';

/**
 * Recursively check whether any string value in `obj` contains the
 * Unicode replacement character, indicating encoding corruption.
 */
function hasReplacementChar(obj: unknown): string | null {
  if (typeof obj === 'string') {
    if (obj.includes(REPLACEMENT_CHAR)) {
      // Return a snippet of the corrupted string for logging
      const idx = obj.indexOf(REPLACEMENT_CHAR);
      const start = Math.max(0, idx - 10);
      const end = Math.min(obj.length, idx + 10);
      return obj.slice(start, end);
    }
    return null;
  }

  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      const result = hasReplacementChar(value);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Middleware that rejects requests containing the Unicode Replacement
 * Character (U+FFFD / �) in string values of the request body.
 *
 * This guards against encoding corruption caused by tools like
 * Git Bash's curl that send inline JSON with non-UTF-8 encoded
 * Chinese characters (converted to the system codepage).
 */
export const encodingCheck = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next();
  }

  const snippet = hasReplacementChar(req.body);
  if (snippet) {
    const path = `${req.method} ${req.originalUrl}`;
    logger.warn('[Encoding] Corrupted string detected in request body', {
      path,
      snippet: `...${snippet}...`,
    });

    return next(
      new AppError(
        400,
        'ENCODING_ERROR',
        '请求正文包含编码损坏的字符（�）。请确保 JSON 使用 UTF-8 编码发送，' +
        '例如在 Git Bash 中使用 curl 时改用 --data-binary 或从文件读取。'
      )
    );
  }

  return next();
};
