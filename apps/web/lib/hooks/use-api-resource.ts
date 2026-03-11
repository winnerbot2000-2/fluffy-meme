"use client";

import { useEffect, useState } from "react";

export function useApiResource<T>({
  loader,
  initialValue,
  enabled = true,
  deps = [],
}: {
  loader: () => Promise<T>;
  initialValue: T;
  enabled?: boolean;
  deps?: unknown[];
}) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    loader()
      .then((value) => {
        if (active) {
          setData(value);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Request failed");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, ...deps]);

  return {
    data,
    loading,
    error,
    setData,
  };
}
