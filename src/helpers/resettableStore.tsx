import { FC, ReactNode, useEffect } from "react";
import { create, StateCreator } from "zustand";

type IProps = {
  children?: ReactNode;
};

export const createResettable = <STATE,>(
  state: StateCreator<STATE>,
  getState?: () => STATE
) => {
  const useStore = create<STATE>(state);
  const initialState = useStore.getState();

  const ResetStoreProvider = ({ children }: IProps) => {
    useEffect(() => {
      return () => {
        useStore.setState(getState ? getState() : initialState, true);
      };
    }, []);

    return <>{children}</>;
  };

  return [useStore, ResetStoreProvider] as [typeof useStore, FC<IProps>];
};
