/* eslint-disable @typescript-eslint/no-explicit-any */

import { StoreApi } from "zustand";

export type IModalActionType<Data, M> =
  | { type: "OPEN"; payload: Data; meta?: M }
  | { type: "CLOSE" | "TOGGLE"; meta?: M }
  | { type: "SET_DATA"; payload: Data; meta?: M };

export type IModal<Data> = {
  data: Data;
  isOpen: boolean;
};

export type IModalCreator<Data, M = unknown> = {
  atom: IModal<Data>;
  open: (...args: Data extends void ? [] | [M] : [Data] | [Data, M]) => void;
  close: (...args: [] | [M]) => void;
  action: (params: IModalActionType<Data, M>) => void;
};

export const modalCreator = <Data, M = unknown>(
  initialState: Data,
  set: (value: Partial<IModal<Data>>) => void,
  get: () => IModal<Data>,
  extra?: { reaction?: (params: IModalActionType<Data, M>) => any }
): IModalCreator<Data, M> => {
  const action: IModalCreator<Data, M>["action"] = (params) => {
    if (params.type === "CLOSE") {
      set({ isOpen: false, data: initialState });
    } else if (params.type === "OPEN") {
      set({
        isOpen: true,
        ...(params.payload ? { data: params.payload } : { data: initialState }),
      });
    } else if (params.type === "TOGGLE") {
      set({ isOpen: !get().isOpen });
    } else if (params.type === "SET_DATA") {
      set({ data: params.payload });
    }
    extra?.reaction?.(params);
  };
  const open: IModalCreator<Data, M>["open"] = (...args) => {
    return initialState || initialState === null
      ? action({ type: "OPEN", payload: args[0] as Data, meta: args[1] })
      : action({ type: "OPEN", payload: initialState, meta: args[0] as M });
  };
  const close: IModalCreator<Data, M>["close"] = (...args) =>
    action({ type: "CLOSE", meta: args?.[0] });
  return { atom: { data: initialState, isOpen: false }, open, close, action };
};

/**
 * Modal Factory
 *
 * @example
 *
 * interface ILayoutSlice {
 *   layout?: IGridLayout;
 *   modal: IModalCreator<undefined>;
 * }
 *
 * export const createLayoutSlice = <T extends ILayoutSlice>(
 *   set: SetState<T>,
 *   get: GetState<T>,
 * ): ILayoutSlice => ({
 *   ...createSlice(....),
 *   ...createModal(set, get, "modal", undefined),
 * })
 */
export const createModal = <
  State extends Record<string, any>,
  K extends keyof State,
  Data,
  M = unknown
>(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  name: K,
  initialState: Data,
  extra?: { reaction?: (params: IModalActionType<Data, M>) => any }
): Record<K, IModalCreator<Data, M>> => {
  return {
    [name]: modalCreator(
      initialState,
      (atom) => {
        set((state) => {
          return { [name]: { ...state[name], atom } } as Partial<State>;
        });
      },
      () => get()[name].atom,
      extra
    ),
  } as Record<K, IModalCreator<Data, M>>;
};
