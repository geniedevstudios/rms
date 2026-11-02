export type StorageAdapter = Pick<Storage, "getItem" | "setItem">;
export function readStorage<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
  storage?: StorageAdapter,
): T {
  try {
    const value: unknown = JSON.parse(
      (storage ?? window.localStorage).getItem(key) ?? "null",
    );
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage<T>(
  key: string,
  value: T,
  storage?: StorageAdapter,
): void {
  try {
    (storage ?? window.localStorage).setItem(key, JSON.stringify(value));
  } catch {
    /* Storage restrictions must not prevent session-only shopping. */
  }
}
