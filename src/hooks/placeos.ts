// src/hooks/placeos.ts
import { useCallback, useEffect, useState, type DependencyList } from "react";
import { Subscription } from "rxjs";
import { getModule } from "@placeos/ts-client";
import { notify } from "../notify";

/** Per-instance subscription tracker. Create in an effect, destroy in its cleanup. */
export interface Binder {
  /** bind() + listen().subscribe(cb) on system/module/status-variable */
  listen<T = unknown>(
    moduleAlias: string,
    name: string,
    cb: (value: T) => void,
  ): void;
  /** Track an arbitrary rxjs Subscription (e.g. connectionState()) */
  track(sub: Subscription): void;
  destroy(): void;
}

export function createBinder(systemId: string): Binder {
  const subs: Subscription[] = [];

  return {
    listen<T = unknown>(
      moduleAlias: string,
      name: string,
      cb: (value: T) => void,
    ) {
      const binding = getModule(systemId, moduleAlias).binding<T>(name);
      subs.push(binding.listen().subscribe(cb));
      subs.push(new Subscription(binding.bind()));
    },
    track(sub: Subscription) {
      subs.push(sub);
    },
    destroy() {
      subs.forEach((s) => s.unsubscribe());
      subs.length = 0;
    },
  };
}

/** Run a binding-setup function with automatic per-instance cleanup. StrictMode-safe:
 *  binder is created INSIDE the effect; cleanup tears down only its own subs. */
export function useBinder(
  systemId: string,
  setup: (binder: Binder) => void,
  deps: DependencyList = [],
): void {
  useEffect(() => {
    const binder = createBinder(systemId);
    setup(binder);
    return () => binder.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId, ...deps]);
}

/** Declarative single-binding hook */
export function useBinding<T = unknown>(
  systemId: string,
  moduleAlias: string,
  name: string,
  initial?: T,
): T | undefined {
  const [value, setValue] = useState<T | undefined>(initial);

  useBinder(
    systemId,
    (binder) => {
      binder.listen<T>(moduleAlias, name, setValue);
    },
    [moduleAlias, name],
  );

  return value;
}

/** Standard execute path — all component-level commands route through this.
 *  Catches errors -> console.error + notify.error(`Command failed: ${method}`), rethrows. */
export function useModuleExecute(systemId: string) {
  return useCallback(
    async <T = unknown>(
      moduleAlias: string,
      method: string,
      args?: unknown[],
    ): Promise<T> => {
      try {
        return await getModule(systemId, moduleAlias).execute<T>(method, args);
      } catch (error) {
        console.error(`[execute] ${moduleAlias}.${method} failed:`, error);
        notify.error(`Command failed: ${method}`);
        throw error;
      }
    },
    [systemId],
  );
}
