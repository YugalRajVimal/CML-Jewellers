import { useEffect, useState } from "react";
import { ApiClientError } from "./api-client";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; data: T };

/** Runs `fetcher` on mount, tracking loading/error/empty/success. `isEmpty` decides the empty case. */
export function useAsync<T>(fetcher: () => Promise<T>, isEmpty: (data: T) => boolean, deps: unknown[] = []) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [prevKey, setPrevKey] = useState(key);

  // Reset to "loading" during render when the dependency signature changes
  // (the React-documented way to adjust state in response to a prop/derived change).
  if (prevKey !== key) {
    setPrevKey(key);
    setState({ status: "loading" });
  }

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (cancelled) return;
        setState(isEmpty(data) ? { status: "empty" } : { status: "success", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiClientError ? err.message : "Something went wrong.";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
