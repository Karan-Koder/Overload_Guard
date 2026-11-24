'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Snapshot } from '@/lib/types';
interface AppContext {
  data: Snapshot | null;
  busy: boolean;
  error: string;
  toast: string;
  mutate: (url: string, body?: unknown, method?: string) => Promise<boolean>;
  reload: () => Promise<void>;
}
const Context = createContext<AppContext | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const locked = useRef(false);
  const reload = useCallback(async () => {
    try {
      const response = await fetch('/api/load', { cache: 'no-store' });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Unable to load dashboard');
      setData(value);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect');
    }
  }, []);
  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const mutate = async (url: string, body?: unknown, method = 'POST') => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Action failed');
      setData(value);
      setToast(
        url.includes('reset')
          ? 'Demo reset. A fresh two-week view is ready.'
          : url.includes('actions')
            ? 'Action saved. Your audit log is up to date.'
            : url.includes('items')
              ? 'Demo load added. Your workload has been rescanned.'
              : method === 'DELETE'
                ? 'Your demo data has been deleted.'
                : 'Settings saved.',
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <Context.Provider value={{ data, busy, error, toast, mutate, reload }}>
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider missing');
  return context;
}
