import { ReactNode, useEffect } from "react";
import { create, StateCreator } from "zustand";

export const createResettable = <STATE,>(
  state: StateCreator<STATE>,
  getState?: () => STATE
) => {
  const useStore = create<STATE>(
    Object.assign(state, { _resettableLifeCycle: false })
  );
  const initialState = useStore.getState();

  const ResetStoreProvider = ({ children }: { children?: ReactNode }) => {
    useEffect(() => {
      const reset = { _resettableLifeCycle: true } as STATE;
      useStore.setState(reset);

      return () => {
        useStore.setState(
          { _resettableLifeCycle: false, ...(getState?.() || initialState) },
          true
        );
      };
    }, []);

    return <>{children}</>;
  };

  return [useStore, ResetStoreProvider] as [
    typeof useStore,
    typeof ResetStoreProvider
  ];
};
