import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "../lib/storage";
/** Keys and validators are stable module constants; existing RMS storage keys are preserved. */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() =>
    readStorage(key, fallback, valid),
  );
  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}
