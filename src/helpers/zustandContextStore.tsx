import { createContext, ReactNode, useContext, useState } from "react";
import { create, StateCreator, StoreApi, useStore } from "zustand";

export const createContextStore = <STATE,>(state: StateCreator<STATE>) => {
  const StoreContext = createContext<StoreApi<STATE> | null>(null);
  const useZustandStore = <R,>(
    selector: (s: STATE) => R,
    equalityFn?: (a: R, b: R) => boolean
  ): R => {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error("[ZustandContextStore] The provider is not defined");
    }
    return useStore(store, selector, equalityFn);
  };
  const createStore = () => create<STATE>(state);

  const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [store] = useState(createStore);
    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  };

  return [useZustandStore, StoreProvider] as const;
};
