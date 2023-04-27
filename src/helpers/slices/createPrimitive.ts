import type { StoreApi } from "zustand";

export type ICreatePrimitive<VALUE> = {
  value: VALUE;
  set: (value: VALUE) => void;
  clear: () => void;
};

export const primitiveStoreCreator = <VALUE>(
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

export type ICreatePrimitiveParams<VALUE, State> = {
  patchEffect?: (value: VALUE) => Partial<State>;
  sideEffect?: (prevValue?: VALUE) => void;
};

export const createPrimitive = <VALUE, State, K extends keyof State>(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  name: K,
  initialState: VALUE,
  params?: ICreatePrimitiveParams<VALUE, State>
): Record<K, ICreatePrimitive<VALUE>> => {
  return {
    [name]: primitiveStoreCreator<VALUE>((value) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevValue: VALUE = (get()[name] as any)?.value;
      set((state) => {
        return {
          ...state,
          ...params?.patchEffect?.(value),
          [name]: { ...state[name], value },
        };
      });
      params?.sideEffect?.(prevValue);
    }, initialState),
  } as Record<K, ICreatePrimitive<VALUE>>;
};
