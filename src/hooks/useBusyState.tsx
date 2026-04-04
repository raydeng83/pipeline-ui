"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BusyState {
  busy: boolean;
  setBusy: (value: boolean) => void;
}

const BusyContext = createContext<BusyState>({ busy: false, setBusy: () => {} });

export function BusyProvider({ children }: { children: ReactNode }) {
  const [busy, setRaw] = useState(false);
  const setBusy = useCallback((value: boolean) => setRaw(value), []);
  return (
    <BusyContext.Provider value={{ busy, setBusy }}>
      {children}
    </BusyContext.Provider>
  );
}

export function useBusyState() {
  return useContext(BusyContext);
}
