export function jsonStringify(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

export function jsonField<T>(value: T | undefined | null, existingFallback: string | null): string | null {
  if (value === undefined) return existingFallback;
  return jsonStringify(value);
}

export function jsonParse<T = any>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function jsonArray<T = any>(value: string | null | undefined, fallback: T[] = []): T[] {
  return jsonParse<T[]>(value, fallback);
}
