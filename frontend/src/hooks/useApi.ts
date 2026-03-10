import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export function usePolling<T>(url: string, intervalMs = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef(url);

  const refetch = useCallback(async () => {
    try {
      const res = await axios.get<T>(urlRef.current);
      setData(res.data);
      setError(null);
    } catch {
      setError(`Failed to fetch ${urlRef.current}`);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refetch, intervalMs]);

  return { data, error, refetch };
}