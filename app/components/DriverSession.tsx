"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "dongrae_driver_v1";

export type DriverSession = {
  id: string;
  name: string;
  password: string;
};

type Ctx = {
  ready: boolean;
  driver: DriverSession | null;
  signIn: (s: DriverSession) => void;
  signOut: () => void;
};

const DriverContext = createContext<Ctx | null>(null);

export function DriverSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [driver, setDriver] = useState<DriverSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DriverSession;
        if (parsed?.id && parsed?.name && parsed?.password) setDriver(parsed);
      }
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, []);

  const signIn = useCallback((s: DriverSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setDriver(s);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDriver(null);
  }, []);

  return (
    <DriverContext.Provider value={{ ready, driver, signIn, signOut }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriverSession(): Ctx {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error("useDriverSession must be used within DriverSessionProvider");
  }
  return ctx;
}
