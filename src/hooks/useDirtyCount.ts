import { useEffect, useState } from 'react';
import { getDirtyCount } from '../services/syncService';

export function useDirtyCount(pollMs: number = 3000): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const c = await getDirtyCount();
      if (!cancelled) setCount(c);
    };

    load();
    const id = setInterval(load, pollMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return count;
}
