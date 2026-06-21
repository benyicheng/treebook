/**
 * BigInt JSON serialization polyfill.
 *
 * SQLite raw queries via Prisma return BigInt for integer columns.
 * JSON.stringify cannot handle BigInt natively, so we patch toJSON.
 *
 * Safety: only applies the patch once; guarded against double-application.
 * WARNING: This is a global prototype mutation — it affects ALL BigInt
 * serialization in the process. If fine-grained control is needed in the
 * future, replace this with a custom JSON replacer per response.
 */

let applied = false;

export function serializeBigInt(): void {
  if (applied) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
  applied = true;
}
