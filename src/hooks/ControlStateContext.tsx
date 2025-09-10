import React, { createContext, useContext } from "react";
import { type ControlState, useControlState } from "./useControlState";

const ControlContext = createContext<ControlState | null>(null);

interface ControlStateProviderProps {
  systemId: string;
  moduleAlias?: string;
  children: React.ReactNode;
}
export function ControlStateProvider({
  systemId,
  moduleAlias = "System",
  children,
}: ControlStateProviderProps) {
  const state = useControlState(systemId, moduleAlias); // ControlState | null

  if (state == null) {
    return <div>NOW LOADING</div>;
  }

  return (
    <ControlContext.Provider value={state}>{children}</ControlContext.Provider>
  );
}

export function useControlContext(): ControlState {
  const context = useContext(ControlContext);
  if (!context)
    throw new Error(
      "useControlContext must be used within a ControlStateProvider",
    );
  return context;
}
