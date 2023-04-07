import type { StoreApi } from "zustand";

export type ICreatePrimitive<VALUE> = {
  value: VALUE;
  set: (value: VALUE) => void;
  clear: () => void;
};

const primitiveStoreCreator = <VALUE>(
  set: (v: VALUE) => void,
  initialState: VALUE
): ICreatePrimitive<VALUE> => {
  const _set = (value: VALUE) => {
    set(value);
  };

  const clear = () => {
    set(initialState);
  };

  return { value: initialState, set: _set, clear };
};

export const createPrimitive = <VALUE, State, K extends keyof State>(
  set: StoreApi<State>["setState"],
  _: StoreApi<State>["getState"],
  name: K,
  initialState: VALUE,
  params?: {
    patchEffect?: (value: VALUE) => Partial<State>;
    sideEffect?: () => void;
  }
): Record<K, ICreatePrimitive<VALUE>> => {
  return {
    [name]: primitiveStoreCreator<VALUE>((value) => {
      set((state) => {
        return {
          ...state,
          ...params?.patchEffect?.(value),
          [name]: { ...state[name], value },
        };
      });
      params?.sideEffect?.();
    }, initialState),
  } as Record<K, ICreatePrimitive<VALUE>>;
};
